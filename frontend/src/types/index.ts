export interface Amenity {
  id: string;
  name: string;
  schedulingIncrement: number;
  availableHours: Array<{
    day: number;
    start_hour: string;
    end_hour: string;
  }>;
  maxPartySize: number;
  maxCapacity: number;
  timezone: string;
  perDayLimit: number;
  perWeekLimit: number;
  image?: string;
  waitlistEnabled: boolean;
  disabledDates: Array<{
    start_date: string;
    end_date: string;
  }>;
}

export interface UserInfo {
  email: string;
  lastName: string;
  unitNumber: string;
}

export enum BookingType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring'
}

export enum BookingStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALWAYS = 'always'
}

export interface BookingJob {
  id: string;
  amenityId: string;
  amenityName: string;
  bookingType: BookingType;
  status: BookingStatus;
  targetDate?: string;
  targetTime?: string;
  recurrenceFrequency?: RecurrenceFrequency;
  preferredTime?: string;
  preferredDaysOfWeek?: number[];
  endDate?: string;
  partySize: number;
  successfulBookings: number;
  failedAttempts: number;
  lastAttempt?: string;
  lastSuccessfulBooking?: string;
  errorMessage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bookedSlots: BookedSlot[];
}

export interface BookedSlot {
  id: string;
  reservationId: string;
  accessCode: string;
  bookedDate: string;
  bookedTime: string;
  createdAt: string;
}

export interface TimeSlot {
  timeslot: string;
  available_capacity: number;
}

export interface AvailabilityResponse {
  available: boolean;
  hasWaitlist: boolean;
  timeSlots: TimeSlot[];
}

export interface CreateBookingJobRequest {
  userEmail: string;
  userLastName: string;
  userUnitNumber: string;
  amenityId: string;
  amenityName: string;
  bookingType: BookingType;
  targetDate?: string;
  targetTime?: string;
  recurrenceFrequency?: RecurrenceFrequency;
  preferredTime?: string;
  preferredDaysOfWeek?: number[];
  endDate?: string;
  partySize?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SchedulerStatus {
  [taskName: string]: boolean;
} 