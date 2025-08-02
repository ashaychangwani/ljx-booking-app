export interface Amenity {
    _id: string;
    name: string;
    scheduling_increment: number;
    available_hours: Array<{
        day: number;
        start_hour: string;
        end_hour: string;
    }>;
    max_party_size: number;
    max_capacity: number;
    timezone: string;
    per_day_limit: number;
    per_week_limit: number;
    terms_of_use: string;
    terms_of_use_agreement_required: boolean;
    image?: string;
    waitlist_enabled: boolean;
    disabled_dates: Array<{
        start_date: string;
        end_date: string;
    }>;
}
export interface TimeSlot {
    timeslot: string;
    available_capacity: number;
}
export interface AvailabilityInfo {
    hasAvailableSlots: boolean;
    hasWaitlist: boolean;
    timeSlots: TimeSlot[];
}
export interface BookingRequest {
    amenityId: string;
    email: string;
    lastName: string;
    unitNumber: string;
    targetDate: string;
    targetTime: string;
    partySize: number;
}
export interface BookingResponse {
    success: boolean;
    reservationId?: string;
    accessCode?: string;
    errorMessage?: string;
}
/**
 * ResPageService - Optimized for minimal API calls and privacy protection
 *
 * API Call Optimization Strategy:
 * - Amenities are cached for 5 minutes to avoid repeated requests
 * - Preliminary checks use fake data to avoid tracing user activity
 * - Only actual bookings and name-unit-match use real user data
 *
 * Privacy Protection:
 * - Uses fake email/unit/name for availability checks, date filters, time slots
 * - Real data used for: /residents/name-unit-match, /reservations, and /blacklist endpoints
 * - User-facing availability checks (from frontend) use real email for accuracy
 * - Background automation checks use fake data to prevent tracking (except blacklist)
 */
export declare class ResPageService {
    private axiosInstance;
    private readonly CAMPAIGN_ID;
    private readonly BASE_URL;
    private amenitiesCache;
    private readonly CACHE_DURATION;
    private readonly FAKE_EMAIL;
    private readonly FAKE_UNIT_NUMBER;
    private readonly FAKE_LAST_NAME;
    constructor();
    getAmenities(): Promise<Amenity[]>;
    getAmenityById(amenityId: string): Promise<Amenity | undefined>;
    getDateFilters(amenityId: string, email: string, startDate: string): Promise<any>;
    getResidentId(lastName: string, unitNumber: string): Promise<string>;
    checkBlacklist(email: string, amenityId: string): Promise<boolean>;
    getAvailableTimeSlots(amenityId: string, date: string, partySize: number, unitNumber: string, useRealData?: boolean): Promise<TimeSlot[]>;
    getFullAvailabilityInfo(amenityId: string, date: string, partySize: number, unitNumber: string, useRealData?: boolean): Promise<AvailabilityInfo>;
    makeReservation(request: BookingRequest, residentId: string, termsOfUse: string): Promise<BookingResponse>;
    private findBestTimeSlot;
    isAmenityAvailable(amenityId: string, date: string, unitNumber: string): Promise<boolean>;
}
//# sourceMappingURL=ResPageService.d.ts.map