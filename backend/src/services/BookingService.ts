import { Repository } from 'typeorm';
import { BookingJob, BookingType, BookingStatus, RecurrenceFrequency, BookedSlot } from '../entities/BookingJob';
import { ResPageService, BookingRequest, BookingResponse } from './ResPageService';
import { logger } from '../utils/logger';
import { AppDataSource } from '../database';

export class BookingService {
  private bookingJobRepository: Repository<BookingJob>;
  private resPageService: ResPageService;

  constructor() {
    this.bookingJobRepository = AppDataSource.getRepository(BookingJob);
    this.resPageService = new ResPageService();
  }

  async createBookingJob(jobData: {
    userEmail: string;
    userLastName: string;
    userUnitNumber: string;
    amenityId: string;
    amenityName: string;
    bookingType: BookingType;
    targetDate?: Date;
    targetTime?: string;
    recurrenceFrequency?: RecurrenceFrequency;
    preferredTime?: string;
    preferredDaysOfWeek?: number[];
    endDate?: Date;
    partySize?: number;
  }): Promise<BookingJob> {
    try {
      const bookingJob = this.bookingJobRepository.create({
        userEmail: jobData.userEmail,
        userLastName: jobData.userLastName,
        userUnitNumber: jobData.userUnitNumber,
        amenityId: jobData.amenityId,
        amenityName: jobData.amenityName,
        bookingType: jobData.bookingType,
        targetDate: jobData.targetDate,
        targetTime: jobData.targetTime,
        recurrenceFrequency: jobData.recurrenceFrequency,
        preferredTime: jobData.preferredTime,
        preferredDaysOfWeek: jobData.preferredDaysOfWeek,
        endDate: jobData.endDate,
        partySize: jobData.partySize || 1,
        status: BookingStatus.ACTIVE,
        isActive: true
      });

      const savedJob = await this.bookingJobRepository.save(bookingJob);
      logger.info(`Created booking job ${savedJob.id} for user ${jobData.userEmail}`);

      return savedJob;
    } catch (error) {
      logger.error('Failed to create booking job:', error);
      throw error;
    }
  }

  async processActiveBookingJobs(): Promise<void> {
    try {
      // First, let's see ALL booking jobs regardless of status
      const allJobs = await this.bookingJobRepository.find();
      logger.info(`🔍 TOTAL BOOKING JOBS IN DATABASE: ${allJobs.length}`);
      
      if (allJobs.length > 0) {
        allJobs.forEach(job => {
          logger.debug(`📝 Job ${job.id}: status=${job.status}, isActive=${job.isActive}, amenity=${job.amenityName}`);
        });
      }

      // Now query for active jobs
      const activeJobs = await this.bookingJobRepository.find({
        where: { 
          status: BookingStatus.ACTIVE,
          isActive: true 
        }
      });

      logger.info(`📋 PROCESSING ${activeJobs.length} ACTIVE BOOKING JOBS`);

      if (activeJobs.length === 0) {
        logger.info('ℹ️  NO ACTIVE BOOKING JOBS FOUND - CREATE SOME JOBS FROM THE AMENITIES PAGE');
        return;
      }

      for (const job of activeJobs) {
        logger.info(`Processing job ${job.id} for ${job.amenityName}`);
        await this.processBookingJob(job);
      }

      logger.info(`✅ COMPLETED PROCESSING ${activeJobs.length} BOOKING JOBS`);
    } catch (error) {
      logger.error('Failed to process booking jobs:', error);
    }
  }

  private async processBookingJob(job: BookingJob): Promise<void> {
    try {
      logger.info(`🔍 STARTING PROCESSING JOB ${job.id} - Type: ${job.bookingType}`);
      job.lastAttempt = new Date();
      
      if (job.bookingType === BookingType.ONE_TIME) {
        logger.info(`📅 Processing ONE-TIME booking for ${job.amenityName}`);
        await this.processOneTimeBooking(job);
      } else if (job.bookingType === BookingType.RECURRING) {
        logger.info(`🔄 Processing RECURRING booking for ${job.amenityName}`);
        await this.processRecurringBooking(job);
      }

      logger.debug(`💾 SAVING job ${job.id} after processing`);
      await this.bookingJobRepository.save(job);
      logger.debug(`✅ FINISHED PROCESSING JOB ${job.id}`);
    } catch (error) {
      logger.error(`❌ FAILED TO PROCESS BOOKING JOB ${job.id}:`, error);
      
      job.failedAttempts++;
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Disable job after too many failures
      if (job.failedAttempts >= 10) {
        job.status = BookingStatus.FAILED;
        job.isActive = false;
        logger.warn(`Disabled booking job ${job.id} due to too many failures`);
      }

      await this.bookingJobRepository.save(job);
    }
  }

  private async processOneTimeBooking(job: BookingJob): Promise<void> {
    logger.debug(`🔍 ONE-TIME BOOKING: Checking requirements for job ${job.id}`);
    
    if (!job.targetDate || !job.targetTime) {
      throw new Error('One-time booking requires target date and time');
    }

    // Skip if this slot is already booked
    const targetDateString = new Date(job.targetDate).toISOString().split('T')[0];
    if (job.bookedSlots.some(slot => slot.bookedDate === targetDateString && slot.bookedTime === job.targetTime)) {
      logger.warn(`🚫 One-time slot for ${targetDateString} at ${job.targetTime} is already booked for job ${job.id}, marking as complete.`);
      job.status = BookingStatus.COMPLETED;
      job.isActive = false;
      return;
    }

    // Check if the target date has passed
    const targetDate = new Date(job.targetDate);
    const now = new Date();
    
    logger.debug(`📅 Target date: ${targetDate.toISOString()}, Current: ${now.toISOString()}`);
    
    if (targetDate < now) {
      job.status = BookingStatus.COMPLETED;
      job.isActive = false;
      logger.info(`One-time booking job ${job.id} expired - target date has passed`);
      return;
    }

    // Check if amenity is available for booking
    logger.debug(`🔍 Checking availability for amenity ${job.amenityId} on ${targetDateString}`);
    
    const isAvailable = await this.resPageService.isAmenityAvailable(
      job.amenityId,
      targetDateString,
      job.userUnitNumber
    );

    logger.debug(`🎯 Availability result: ${isAvailable}`);

    if (!isAvailable) {
      logger.debug(`Amenity ${job.amenityId} not available for ${targetDateString}`);
      return;
    }

    // Try to make the booking
    logger.debug(`🚀 ATTEMPTING TO MAKE RESERVATION for ${job.amenityName}`);
    
    const bookingRequest: BookingRequest = {
      amenityId: job.amenityId,
      email: job.userEmail,
      lastName: job.userLastName,
      unitNumber: job.userUnitNumber,
      targetDate: targetDateString,
      targetTime: job.targetTime,
      partySize: job.partySize
    };

    logger.debug(`📝 Booking request:`, bookingRequest);

    const amenity = await this.resPageService.getAmenityById(job.amenityId);
    const termsOfUse = amenity?.terms_of_use || '';

    logger.debug(`🏢 Getting resident ID for ${job.userLastName}, Unit ${job.userUnitNumber}`);
    // Get residentId dynamically
    const residentId = await this.resPageService.getResidentId(job.userLastName, job.userUnitNumber);
    logger.debug(`👤 Resident ID: ${residentId}`);

    logger.debug(`📞 Making reservation call to ResPageService...`);
    const result = await this.resPageService.makeReservation(
      bookingRequest,
      residentId,
      termsOfUse
    );

    logger.debug(`📋 Reservation result:`, result);

    if (result.success) {
      job.successfulBookings++;
      job.lastSuccessfulBooking = new Date();
      job.status = BookingStatus.COMPLETED;
      job.isActive = false;
      job.errorMessage = undefined;
      
      const bookedSlot = new BookedSlot();
      bookedSlot.bookingJob = job;
      bookedSlot.reservationId = result.reservationId!;
      bookedSlot.accessCode = result.accessCode!;
      bookedSlot.bookedDate = targetDateString;
      bookedSlot.bookedTime = job.targetTime!;
      
      if (!job.bookedSlots) {
        job.bookedSlots = [];
      }
      job.bookedSlots.push(bookedSlot);
      
      logger.info(`Successfully booked ${job.amenityName} for ${job.userEmail} (Reservation: ${result.reservationId})`);
    } else {
      throw new Error(result.errorMessage || 'Booking failed');
    }
  }

  private async processRecurringBooking(job: BookingJob): Promise<void> {
    logger.info(`🔍 RECURRING BOOKING: Starting for job ${job.id}`);
    
    if (!job.recurrenceFrequency || !job.preferredTime) {
      throw new Error('Recurring booking requires recurrence frequency and preferred time');
    }

    logger.debug(`📋 Job details: frequency=${job.recurrenceFrequency}, preferredTime=${job.preferredTime}, preferredDays=${job.preferredDaysOfWeek}`);

    // Check if we should stop recurring bookings
    if (job.endDate && new Date() > new Date(job.endDate)) {
      job.status = BookingStatus.COMPLETED;
      job.isActive = false;
      logger.info(`Recurring booking job ${job.id} completed - end date reached`);
      return;
    }

    logger.debug(`🗓️ Getting next booking dates...`);
    const targetDates = this.getNextBookingDates(job);
    logger.debug(`🎯 Found ${targetDates.length} target dates:`, targetDates.map(d => d.toISOString().split('T')[0]));
    
    if (targetDates.length === 0) {
      logger.warn(`⚠️ No target dates found for recurring booking ${job.id}`);
      return;
    }
    
    for (const targetDate of targetDates) {
      const targetDateString = targetDate.toISOString().split('T')[0];
      
      // Skip if this slot is already booked
      if (job.bookedSlots.some(slot => slot.bookedDate === targetDateString && slot.bookedTime === job.preferredTime)) {
        logger.warn(`🚫 Slot for ${targetDateString} at ${job.preferredTime} is already booked for job ${job.id}, skipping.`);
        continue;
      }
      
      logger.debug(`🔍 Checking availability for ${job.amenityName} on ${targetDateString} at ${job.preferredTime}`);
      
      // Check if amenity is available
      const isAvailable = await this.resPageService.isAmenityAvailable(
        job.amenityId,
        targetDateString,
        job.userUnitNumber
      );

      logger.debug(`🎯 Availability result for ${targetDateString}: ${isAvailable}`);

      if (!isAvailable) {
        logger.warn(`❌ Not available on ${targetDateString}, trying next date...`);
        continue;
      }

      // Try to make the booking
      logger.debug(`🚀 ATTEMPTING RECURRING RESERVATION for ${job.amenityName} on ${targetDateString}`);
      
      const bookingRequest: BookingRequest = {
        amenityId: job.amenityId,
        email: job.userEmail,
        lastName: job.userLastName,
        unitNumber: job.userUnitNumber,
        targetDate: targetDateString,
        targetTime: job.preferredTime,
        partySize: job.partySize
      };

      logger.debug(`📝 Recurring booking request:`, bookingRequest);

      const amenity = await this.resPageService.getAmenityById(job.amenityId);
      const termsOfUse = amenity?.terms_of_use || '';

      logger.debug(`🏢 Getting resident ID for recurring booking: ${job.userLastName}, Unit ${job.userUnitNumber}`);
      // Get residentId dynamically
      const residentId = await this.resPageService.getResidentId(job.userLastName, job.userUnitNumber);
      logger.debug(`👤 Resident ID for recurring booking: ${residentId}`);

      logger.debug(`📞 Making recurring reservation call to ResPageService...`);
      const result = await this.resPageService.makeReservation(
        bookingRequest,
        residentId,
        termsOfUse
      );

      logger.debug(`📋 Recurring reservation result:`, result);

      if (result.success) {
        job.successfulBookings++;
        job.lastSuccessfulBooking = new Date();
        job.errorMessage = undefined;
        
        const bookedSlot = new BookedSlot();
        bookedSlot.bookingJob = job;
        bookedSlot.reservationId = result.reservationId!;
        bookedSlot.accessCode = result.accessCode!;
        bookedSlot.bookedDate = targetDateString;
        bookedSlot.bookedTime = job.preferredTime!;

        if (!job.bookedSlots) {
          job.bookedSlots = [];
        }
        job.bookedSlots.push(bookedSlot);
        
        logger.info(`Successfully booked recurring ${job.amenityName} for ${job.userEmail} on ${targetDateString} (Reservation: ${result.reservationId})`);
        
        // For "always" bookings, continue indefinitely
        // For other frequencies, we'll keep trying
        break; // Only book one slot per processing cycle
      } else {
        logger.warn(`❌ Booking failed for ${targetDateString}: ${result.errorMessage}`);
      }
    }
    
    logger.debug(`🔚 FINISHED processing recurring booking for job ${job.id}`);
  }

  private getNextBookingDates(job: BookingJob): Date[] {
    const now = new Date();
    const dates: Date[] = [];
    
    switch (job.recurrenceFrequency) {
      case RecurrenceFrequency.ALWAYS:
        // Try to book for the next 7 days
        for (let i = 1; i <= 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          
          if (this.isDayOfWeekAllowed(date, job.preferredDaysOfWeek)) {
            dates.push(date);
          }
        }
        break;
        
      case RecurrenceFrequency.DAILY:
        // Try to book for tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (this.isDayOfWeekAllowed(tomorrow, job.preferredDaysOfWeek)) {
          dates.push(tomorrow);
        }
        break;
        
      case RecurrenceFrequency.WEEKLY:
        // Find the next occurrence of the preferred day(s) within the next 4 weeks
        for (let week = 0; week < 4; week++) {
          for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + i + (week * 7));
            
            if (this.isDayOfWeekAllowed(nextDate, job.preferredDaysOfWeek)) {
              dates.push(nextDate);
              // For weekly, we'll check all occurrences in the next 4 weeks
              // The availability check will determine which one to book
            }
          }
        }
        break;
        
      case RecurrenceFrequency.MONTHLY:
        // Try to book for next month
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        if (this.isDayOfWeekAllowed(nextMonth, job.preferredDaysOfWeek)) {
          dates.push(nextMonth);
        }
        break;
    }
    
    return dates;
  }

  private isDayOfWeekAllowed(date: Date, allowedDays?: number[]): boolean {
    if (!allowedDays || allowedDays.length === 0) {
      return true; // Allow all days if none specified
    }
    
    // Convert string days to numbers if needed (fix type mismatch)
    const numericAllowedDays = allowedDays.map(day => typeof day === 'string' ? parseInt(day, 10) : day);
    
    const isAllowed = numericAllowedDays.includes(date.getDay());
    
    return isAllowed;
  }

  async getUserBookingJobs(userEmail: string): Promise<BookingJob[]> {
    return this.bookingJobRepository.find({
      where: { userEmail },
      order: { createdAt: 'DESC' }
    });
  }

  async updateBookingJob(jobId: string, updates: Partial<BookingJob>): Promise<BookingJob | null> {
    const job = await this.bookingJobRepository.findOne({ 
      where: { id: jobId }
    });
    
    if (!job) {
      return null;
    }

    Object.assign(job, updates);
    return this.bookingJobRepository.save(job);
  }

  async deleteBookingJob(jobId: string): Promise<boolean> {
    const result = await this.bookingJobRepository.delete(jobId);
    return result.affected === 1;
  }

  async deleteBookedSlot(slotId: string): Promise<boolean> {
    const result = await AppDataSource.getRepository(BookedSlot).delete(slotId);
    return result.affected === 1;
  }
} 