export declare enum BookingType {
    ONE_TIME = "one_time",
    RECURRING = "recurring"
}
export declare enum BookingStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum RecurrenceFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    ALWAYS = "always"
}
export declare class BookingJob {
    id: string;
    userEmail: string;
    userLastName: string;
    userUnitNumber: string;
    amenityId: string;
    amenityName: string;
    bookingType: BookingType;
    status: BookingStatus;
    targetDate: Date;
    targetTime: string;
    recurrenceFrequency: RecurrenceFrequency;
    preferredTime: string;
    preferredDaysOfWeek: number[];
    endDate: Date;
    partySize: number;
    successfulBookings: number;
    failedAttempts: number;
    lastAttempt: Date;
    lastSuccessfulBooking: Date;
    errorMessage: string;
    isActive: boolean;
    bookedSlots: BookedSlot[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class BookedSlot {
    id: string;
    bookingJob: BookingJob;
    reservationId: string;
    accessCode: string;
    bookedDate: string;
    bookedTime: string;
    createdAt: Date;
}
//# sourceMappingURL=BookingJob.d.ts.map