import axios from 'axios';
import {
  Amenity,
  BookingJob,
  TimeSlot,
  AvailabilityResponse,
  CreateBookingJobRequest,
  ApiResponse,
  SchedulerStatus
} from '@/types';

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
);

// Amenities API
export const amenitiesApi = {
  getAll: async (): Promise<Amenity[]> => {
    const response = await api.get<ApiResponse<Amenity[]>>('/amenities');
    return response.data.data || [];
  },

  checkAvailability: async (amenityId: string, date: string, email: string, partySize = 1): Promise<AvailabilityResponse> => {
    const response = await api.get<ApiResponse<AvailabilityResponse>>(
      `/amenities/${amenityId}/availability`,
      { params: { date, email, partySize } }
    );
    return response.data.data || { available: false, hasWaitlist: false, timeSlots: [] };
  },

  getTimeSlots: async (amenityId: string, date: string, email: string, partySize = 1): Promise<TimeSlot[]> => {
    const response = await api.get<ApiResponse<TimeSlot[]>>(
      `/amenities/${amenityId}/time-slots`,
      { params: { date, email, partySize } }
    );
    return response.data.data || [];
  },
};

// Booking Jobs API
export const bookingJobsApi = {
  create: async (jobData: CreateBookingJobRequest): Promise<BookingJob> => {
    const response = await api.post<ApiResponse<BookingJob>>('/booking-jobs', jobData);
    return response.data.data!;
  },

  getUserJobs: async (userEmail: string): Promise<BookingJob[]> => {
    const response = await api.get<ApiResponse<BookingJob[]>>(`/booking-jobs/user/${encodeURIComponent(userEmail)}`);
    return response.data.data || [];
  },

  update: async (id: string, updates: Partial<BookingJob>): Promise<BookingJob> => {
    const response = await api.put<ApiResponse<BookingJob>>(`/booking-jobs/${id}`, updates);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/booking-jobs/${id}`);
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    await api.delete(`/booking-jobs/slots/${slotId}`);
  },

  pause: async (id: string): Promise<BookingJob> => {
    const response = await api.post<ApiResponse<BookingJob>>(`/booking-jobs/${id}/pause`);
    return response.data.data!;
  },

  resume: async (id: string): Promise<BookingJob> => {
    const response = await api.post<ApiResponse<BookingJob>>(`/booking-jobs/${id}/resume`);
    return response.data.data!;
  },
};

// Scheduler API
export const schedulerApi = {
  trigger: async (): Promise<void> => {
    await api.post('/scheduler/trigger');
  },

  getStatus: async (): Promise<SchedulerStatus> => {
    const response = await api.get<ApiResponse<SchedulerStatus>>('/scheduler/status');
    return response.data.data || {};
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api; 