import { BookingJob, BookingType, RecurrenceFrequency } from '../entities/BookingJob';
export declare class BookingService {
    private bookingJobRepository;
    private resPageService;
    constructor();
    createBookingJob(jobData: {
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
    }): Promise<BookingJob>;
    processActiveBookingJobs(): Promise<void>;
    private processBookingJob;
    private processOneTimeBooking;
    private processRecurringBooking;
    private getNextBookingDates;
    private isDayOfWeekAllowed;
    getUserBookingJobs(userEmail: string): Promise<BookingJob[]>;
    updateBookingJob(jobId: string, updates: Partial<BookingJob>): Promise<BookingJob | null>;
    deleteBookingJob(jobId: string): Promise<boolean>;
    deleteBookedSlot(slotId: string): Promise<boolean>;
}
//# sourceMappingURL=BookingService.d.ts.map