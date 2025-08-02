"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const BookingJob_1 = require("../entities/BookingJob");
const ResPageService_1 = require("./ResPageService");
const logger_1 = require("../utils/logger");
const database_1 = require("../database");
class BookingService {
    constructor() {
        this.bookingJobRepository = database_1.AppDataSource.getRepository(BookingJob_1.BookingJob);
        this.resPageService = new ResPageService_1.ResPageService();
    }
    async createBookingJob(jobData) {
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
                status: BookingJob_1.BookingStatus.ACTIVE,
                isActive: true
            });
            const savedJob = await this.bookingJobRepository.save(bookingJob);
            logger_1.logger.info(`Created booking job ${savedJob.id} for user ${jobData.userEmail}`);
            return savedJob;
        }
        catch (error) {
            logger_1.logger.error('Failed to create booking job:', error);
            throw error;
        }
    }
    async processActiveBookingJobs() {
        try {
            // First, let's see ALL booking jobs regardless of status
            const allJobs = await this.bookingJobRepository.find();
            logger_1.logger.info(`🔍 TOTAL BOOKING JOBS IN DATABASE: ${allJobs.length}`);
            if (allJobs.length > 0) {
                allJobs.forEach(job => {
                    logger_1.logger.debug(`📝 Job ${job.id}: status=${job.status}, isActive=${job.isActive}, amenity=${job.amenityName}`);
                });
            }
            // Now query for active jobs
            const activeJobs = await this.bookingJobRepository.find({
                where: {
                    status: BookingJob_1.BookingStatus.ACTIVE,
                    isActive: true
                }
            });
            logger_1.logger.info(`📋 PROCESSING ${activeJobs.length} ACTIVE BOOKING JOBS`);
            if (activeJobs.length === 0) {
                logger_1.logger.info('ℹ️  NO ACTIVE BOOKING JOBS FOUND - CREATE SOME JOBS FROM THE AMENITIES PAGE');
                return;
            }
            for (const job of activeJobs) {
                logger_1.logger.info(`Processing job ${job.id} for ${job.amenityName}`);
                await this.processBookingJob(job);
            }
            logger_1.logger.info(`✅ COMPLETED PROCESSING ${activeJobs.length} BOOKING JOBS`);
        }
        catch (error) {
            logger_1.logger.error('Failed to process booking jobs:', error);
        }
    }
    async processBookingJob(job) {
        try {
            logger_1.logger.info(`🔍 STARTING PROCESSING JOB ${job.id} - Type: ${job.bookingType}`);
            job.lastAttempt = new Date();
            if (job.bookingType === BookingJob_1.BookingType.ONE_TIME) {
                logger_1.logger.info(`📅 Processing ONE-TIME booking for ${job.amenityName}`);
                await this.processOneTimeBooking(job);
            }
            else if (job.bookingType === BookingJob_1.BookingType.RECURRING) {
                logger_1.logger.info(`🔄 Processing RECURRING booking for ${job.amenityName}`);
                await this.processRecurringBooking(job);
            }
            logger_1.logger.debug(`💾 SAVING job ${job.id} after processing`);
            await this.bookingJobRepository.save(job);
            logger_1.logger.debug(`✅ FINISHED PROCESSING JOB ${job.id}`);
        }
        catch (error) {
            logger_1.logger.error(`❌ FAILED TO PROCESS BOOKING JOB ${job.id}:`, error);
            job.failedAttempts++;
            job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Disable job after too many failures
            if (job.failedAttempts >= 10) {
                job.status = BookingJob_1.BookingStatus.FAILED;
                job.isActive = false;
                logger_1.logger.warn(`Disabled booking job ${job.id} due to too many failures`);
            }
            await this.bookingJobRepository.save(job);
        }
    }
    async processOneTimeBooking(job) {
        logger_1.logger.debug(`🔍 ONE-TIME BOOKING: Checking requirements for job ${job.id}`);
        if (!job.targetDate || !job.targetTime) {
            throw new Error('One-time booking requires target date and time');
        }
        // Skip if this slot is already booked
        const targetDateString = new Date(job.targetDate).toISOString().split('T')[0];
        if (job.bookedSlots.some(slot => slot.bookedDate === targetDateString && slot.bookedTime === job.targetTime)) {
            logger_1.logger.warn(`🚫 One-time slot for ${targetDateString} at ${job.targetTime} is already booked for job ${job.id}, marking as complete.`);
            job.status = BookingJob_1.BookingStatus.COMPLETED;
            job.isActive = false;
            return;
        }
        // Check if the target date has passed
        const targetDate = new Date(job.targetDate);
        const now = new Date();
        logger_1.logger.debug(`📅 Target date: ${targetDate.toISOString()}, Current: ${now.toISOString()}`);
        if (targetDate < now) {
            job.status = BookingJob_1.BookingStatus.COMPLETED;
            job.isActive = false;
            logger_1.logger.info(`One-time booking job ${job.id} expired - target date has passed`);
            return;
        }
        // Check if amenity is available for booking
        logger_1.logger.debug(`🔍 Checking availability for amenity ${job.amenityId} on ${targetDateString}`);
        const isAvailable = await this.resPageService.isAmenityAvailable(job.amenityId, targetDateString, job.userUnitNumber);
        logger_1.logger.debug(`🎯 Availability result: ${isAvailable}`);
        if (!isAvailable) {
            logger_1.logger.debug(`Amenity ${job.amenityId} not available for ${targetDateString}`);
            return;
        }
        // Try to make the booking
        logger_1.logger.debug(`🚀 ATTEMPTING TO MAKE RESERVATION for ${job.amenityName}`);
        const bookingRequest = {
            amenityId: job.amenityId,
            email: job.userEmail,
            lastName: job.userLastName,
            unitNumber: job.userUnitNumber,
            targetDate: targetDateString,
            targetTime: job.targetTime,
            partySize: job.partySize
        };
        logger_1.logger.debug(`📝 Booking request:`, bookingRequest);
        const amenity = await this.resPageService.getAmenityById(job.amenityId);
        const termsOfUse = amenity?.terms_of_use || '';
        logger_1.logger.debug(`🏢 Getting resident ID for ${job.userLastName}, Unit ${job.userUnitNumber}`);
        // Get residentId dynamically
        const residentId = await this.resPageService.getResidentId(job.userLastName, job.userUnitNumber);
        logger_1.logger.debug(`👤 Resident ID: ${residentId}`);
        logger_1.logger.debug(`📞 Making reservation call to ResPageService...`);
        const result = await this.resPageService.makeReservation(bookingRequest, residentId, termsOfUse);
        logger_1.logger.debug(`📋 Reservation result:`, result);
        if (result.success) {
            job.successfulBookings++;
            job.lastSuccessfulBooking = new Date();
            job.status = BookingJob_1.BookingStatus.COMPLETED;
            job.isActive = false;
            job.errorMessage = undefined;
            const bookedSlot = new BookingJob_1.BookedSlot();
            bookedSlot.bookingJob = job;
            bookedSlot.reservationId = result.reservationId;
            bookedSlot.accessCode = result.accessCode;
            bookedSlot.bookedDate = targetDateString;
            bookedSlot.bookedTime = job.targetTime;
            if (!job.bookedSlots) {
                job.bookedSlots = [];
            }
            job.bookedSlots.push(bookedSlot);
            logger_1.logger.info(`Successfully booked ${job.amenityName} for ${job.userEmail} (Reservation: ${result.reservationId})`);
        }
        else {
            throw new Error(result.errorMessage || 'Booking failed');
        }
    }
    async processRecurringBooking(job) {
        logger_1.logger.info(`🔍 RECURRING BOOKING: Starting for job ${job.id}`);
        if (!job.recurrenceFrequency || !job.preferredTime) {
            throw new Error('Recurring booking requires recurrence frequency and preferred time');
        }
        logger_1.logger.debug(`📋 Job details: frequency=${job.recurrenceFrequency}, preferredTime=${job.preferredTime}, preferredDays=${job.preferredDaysOfWeek}`);
        // Check if we should stop recurring bookings
        if (job.endDate && new Date() > new Date(job.endDate)) {
            job.status = BookingJob_1.BookingStatus.COMPLETED;
            job.isActive = false;
            logger_1.logger.info(`Recurring booking job ${job.id} completed - end date reached`);
            return;
        }
        logger_1.logger.debug(`🗓️ Getting next booking dates...`);
        const targetDates = this.getNextBookingDates(job);
        logger_1.logger.debug(`🎯 Found ${targetDates.length} target dates:`, targetDates.map(d => d.toISOString().split('T')[0]));
        if (targetDates.length === 0) {
            logger_1.logger.warn(`⚠️ No target dates found for recurring booking ${job.id}`);
            return;
        }
        for (const targetDate of targetDates) {
            const targetDateString = targetDate.toISOString().split('T')[0];
            // Skip if this slot is already booked
            if (job.bookedSlots.some(slot => slot.bookedDate === targetDateString && slot.bookedTime === job.preferredTime)) {
                logger_1.logger.warn(`🚫 Slot for ${targetDateString} at ${job.preferredTime} is already booked for job ${job.id}, skipping.`);
                continue;
            }
            logger_1.logger.debug(`🔍 Checking availability for ${job.amenityName} on ${targetDateString} at ${job.preferredTime}`);
            // Check if amenity is available
            const isAvailable = await this.resPageService.isAmenityAvailable(job.amenityId, targetDateString, job.userUnitNumber);
            logger_1.logger.debug(`🎯 Availability result for ${targetDateString}: ${isAvailable}`);
            if (!isAvailable) {
                logger_1.logger.warn(`❌ Not available on ${targetDateString}, trying next date...`);
                continue;
            }
            // Try to make the booking
            logger_1.logger.debug(`🚀 ATTEMPTING RECURRING RESERVATION for ${job.amenityName} on ${targetDateString}`);
            const bookingRequest = {
                amenityId: job.amenityId,
                email: job.userEmail,
                lastName: job.userLastName,
                unitNumber: job.userUnitNumber,
                targetDate: targetDateString,
                targetTime: job.preferredTime,
                partySize: job.partySize
            };
            logger_1.logger.debug(`📝 Recurring booking request:`, bookingRequest);
            const amenity = await this.resPageService.getAmenityById(job.amenityId);
            const termsOfUse = amenity?.terms_of_use || '';
            logger_1.logger.debug(`🏢 Getting resident ID for recurring booking: ${job.userLastName}, Unit ${job.userUnitNumber}`);
            // Get residentId dynamically
            const residentId = await this.resPageService.getResidentId(job.userLastName, job.userUnitNumber);
            logger_1.logger.debug(`👤 Resident ID for recurring booking: ${residentId}`);
            logger_1.logger.debug(`📞 Making recurring reservation call to ResPageService...`);
            const result = await this.resPageService.makeReservation(bookingRequest, residentId, termsOfUse);
            logger_1.logger.debug(`📋 Recurring reservation result:`, result);
            if (result.success) {
                job.successfulBookings++;
                job.lastSuccessfulBooking = new Date();
                job.errorMessage = undefined;
                const bookedSlot = new BookingJob_1.BookedSlot();
                bookedSlot.bookingJob = job;
                bookedSlot.reservationId = result.reservationId;
                bookedSlot.accessCode = result.accessCode;
                bookedSlot.bookedDate = targetDateString;
                bookedSlot.bookedTime = job.preferredTime;
                if (!job.bookedSlots) {
                    job.bookedSlots = [];
                }
                job.bookedSlots.push(bookedSlot);
                logger_1.logger.info(`Successfully booked recurring ${job.amenityName} for ${job.userEmail} on ${targetDateString} (Reservation: ${result.reservationId})`);
                // For "always" bookings, continue indefinitely
                // For other frequencies, we'll keep trying
                break; // Only book one slot per processing cycle
            }
            else {
                logger_1.logger.warn(`❌ Booking failed for ${targetDateString}: ${result.errorMessage}`);
            }
        }
        logger_1.logger.debug(`🔚 FINISHED processing recurring booking for job ${job.id}`);
    }
    getNextBookingDates(job) {
        const now = new Date();
        const dates = [];
        switch (job.recurrenceFrequency) {
            case BookingJob_1.RecurrenceFrequency.ALWAYS:
                // Try to book for the next 7 days
                for (let i = 1; i <= 7; i++) {
                    const date = new Date(now);
                    date.setDate(date.getDate() + i);
                    if (this.isDayOfWeekAllowed(date, job.preferredDaysOfWeek)) {
                        dates.push(date);
                    }
                }
                break;
            case BookingJob_1.RecurrenceFrequency.DAILY:
                // Try to book for tomorrow
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (this.isDayOfWeekAllowed(tomorrow, job.preferredDaysOfWeek)) {
                    dates.push(tomorrow);
                }
                break;
            case BookingJob_1.RecurrenceFrequency.WEEKLY:
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
            case BookingJob_1.RecurrenceFrequency.MONTHLY:
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
    isDayOfWeekAllowed(date, allowedDays) {
        if (!allowedDays || allowedDays.length === 0) {
            return true; // Allow all days if none specified
        }
        // Convert string days to numbers if needed (fix type mismatch)
        const numericAllowedDays = allowedDays.map(day => typeof day === 'string' ? parseInt(day, 10) : day);
        const isAllowed = numericAllowedDays.includes(date.getDay());
        return isAllowed;
    }
    async getUserBookingJobs(userEmail) {
        return this.bookingJobRepository.find({
            where: { userEmail },
            order: { createdAt: 'DESC' }
        });
    }
    async updateBookingJob(jobId, updates) {
        const job = await this.bookingJobRepository.findOne({
            where: { id: jobId }
        });
        if (!job) {
            return null;
        }
        Object.assign(job, updates);
        return this.bookingJobRepository.save(job);
    }
    async deleteBookingJob(jobId) {
        const result = await this.bookingJobRepository.delete(jobId);
        return result.affected === 1;
    }
    async deleteBookedSlot(slotId) {
        const result = await database_1.AppDataSource.getRepository(BookingJob_1.BookedSlot).delete(slotId);
        return result.affected === 1;
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=BookingService.js.map