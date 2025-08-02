import React, { useState, useEffect } from 'react';
import { amenitiesApi, bookingJobsApi } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import { 
  Amenity, 
  BookingType, 
  RecurrenceFrequency,
  BookingJob,
  CreateBookingJobRequest 
} from '@/types';
import { CalendarIcon, ClockIcon, UserGroupIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AmenityCategory {
  title: string;
  description: string;
  amenities: Amenity[];
  type: 'fitness' | 'regular';
}

interface BookingModalProps {
  amenity: Amenity;
  isOpen: boolean;
  onClose: () => void;
  onBook: (bookingData: any) => void;
  type: 'fitness' | 'regular';
}

interface AvailabilityStatus {
  isAvailable: boolean;
  hasWaitlist: boolean;
  nextAvailableSlot?: string;
  nextWaitlistSlot?: string;
  loading: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ amenity, isOpen, onClose, onBook, type }) => {
  const [formData, setFormData] = useState({
    targetDate: '',
    targetTime: '',
    partySize: 1,
    recurrenceFrequency: RecurrenceFrequency.WEEKLY,
    preferredTime: '',
    preferredDaysOfWeek: [] as number[],
    endDate: ''
  });

  // Auto-select options when there's only one available
  useEffect(() => {
    if (!isOpen || type !== 'fitness') return;

    const availableDays = getAvailableDaysOfWeek();
    
    // Auto-select if only one day available
    if (availableDays.length === 1 && formData.preferredDaysOfWeek.length === 0) {
      setFormData(prev => ({
        ...prev,
        preferredDaysOfWeek: [availableDays[0].value]
      }));
    }
  }, [isOpen, type, amenity.name]);

  // Auto-select preferred time when there's only one option
  useEffect(() => {
    if (!isOpen || type !== 'fitness') return;

    const timeOptions = getTimeOptionsForSelectedDays();
    
    // Auto-select if only one time available and no time currently selected
    if (timeOptions.length === 1 && !formData.preferredTime) {
      setFormData(prev => ({
        ...prev,
        preferredTime: timeOptions[0]
      }));
    }
  }, [formData.preferredDaysOfWeek, isOpen, type, amenity.name]);

  if (!isOpen) return null;

  // Helper function to get available days of week for this amenity
  const getAvailableDaysOfWeek = () => {
    const availableDays = amenity.availableHours.map(hour => hour.day);
    const uniqueDays = [...new Set(availableDays)].sort();
    
    const weekDays = [
      { value: 0, label: 'Sunday' },
      { value: 1, label: 'Monday' },
      { value: 2, label: 'Tuesday' },
      { value: 3, label: 'Wednesday' },
      { value: 4, label: 'Thursday' },
      { value: 5, label: 'Friday' },
      { value: 6, label: 'Saturday' }
    ];
    
    return weekDays.filter(day => uniqueDays.includes(day.value));
  };

  // Helper function to generate time options for a given day
  const getTimeOptionsForDay = (dayOfWeek: number) => {
    const dayHours = amenity.availableHours.filter(hour => hour.day === dayOfWeek);
    const timeOptions: string[] = [];

    dayHours.forEach(({ start_hour, end_hour }) => {
      try {
        // More robust time parsing to handle various formats
        const parseTimeString = (timeStr: string): Date => {
          // Handle different time formats
          let normalizedTime = timeStr;
          
          // If it's just a number (e.g., "9" for 9 AM), add ":00"
          if (/^\d{1,2}$/.test(timeStr)) {
            normalizedTime = `${timeStr.padStart(2, '0')}:00`;
          }
          
          // If it's "H:MM" format, pad to "HH:MM"
          if (/^\d{1}:\d{2}$/.test(timeStr)) {
            normalizedTime = `0${timeStr}`;
          }
          
          // Handle 12-hour format (e.g., "6:00 PM")
          if (/\d{1,2}:\d{2}\s?(AM|PM)/i.test(timeStr)) {
            const date = new Date(`2000-01-01 ${timeStr}`);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
          
          // Ensure we have HH:MM format for 24-hour times
          if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
            throw new Error(`Invalid time format: ${timeStr}`);
          }
          
          return new Date(`2000-01-01T${normalizedTime}:00`);
        };

        const startTime = parseTimeString(start_hour);
        const endTime = parseTimeString(end_hour);
        let increment = amenity.schedulingIncrement || 30; // Default to 30 minutes if not specified
        
        // Override: 45-minute slots don't exist, convert to 60 minutes
        if (increment === 45) {
          increment = 60;
        }

        // Validate the parsed times
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return;
        }

        // Calculate the duration in minutes
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

        // Check if this is a very short time slot (likely a scheduled class with fixed start time)
        // Only treat as a scheduled class if duration is exactly equal to increment (not just <=)
        const isScheduledClass = durationMinutes === increment;
        
        if (isScheduledClass) {
          // For scheduled classes (like yoga at exactly 9:00-9:30), just add the start time
          const timeString = startTime.toTimeString().slice(0, 5); // "HH:MM"
          timeOptions.push(timeString);
        } else {
          // For all other amenities (saunas, pools, etc.), generate slots based on increment
          if (startTime >= endTime) {
            return;
          }

          let currentTime = new Date(startTime);
          while (currentTime < endTime) {
            const timeString = currentTime.toTimeString().slice(0, 5); // "HH:MM"
            timeOptions.push(timeString);
            currentTime.setMinutes(currentTime.getMinutes() + increment);
          }
        }
      } catch (error) {
        console.error(`Error processing time slot for ${amenity.name}:`, error);
      }
    });

    const uniqueOptions = [...new Set(timeOptions)].sort();
    return uniqueOptions;
  };

  // Get all possible time options for this amenity (for one-time bookings)
  const getAllTimeOptions = () => {
    const allTimes: string[] = [];
    amenity.availableHours.forEach(({ day, start_hour, end_hour }) => {
      const dayTimes = getTimeOptionsForDay(day);
      allTimes.push(...dayTimes);
    });
    
    const uniqueTimes = [...new Set(allTimes)].sort();
    return uniqueTimes;
  };

  // Helper function to get available time options based on selected days (for recurring bookings)
  const getTimeOptionsForSelectedDays = () => {
    if (formData.preferredDaysOfWeek.length === 0) {
      return getAllTimeOptions();
    }

    const allTimes: string[] = [];
    formData.preferredDaysOfWeek.forEach(day => {
      const dayTimes = getTimeOptionsForDay(day);
      allTimes.push(...dayTimes);
    });
    
    const uniqueTimes = [...new Set(allTimes)].sort();
    return uniqueTimes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'fitness') {
      // For fitness classes, create recurring booking
      const bookingData: any = {
        bookingType: BookingType.RECURRING,
        recurrenceFrequency: formData.recurrenceFrequency,
        partySize: formData.partySize
      };

      if (formData.recurrenceFrequency === RecurrenceFrequency.ALWAYS) {
        // For "every time available", send all available days and times
        const allAvailableDays = getAvailableDaysOfWeek().map(day => day.value);
        const allAvailableTimes = getAllTimeOptions();
        
        bookingData.preferredDaysOfWeek = allAvailableDays;
        bookingData.preferredTime = allAvailableTimes.length > 0 ? allAvailableTimes[0] : ''; // Use first available time or empty
        // Don't set endDate for "always" bookings
      } else {
        // For weekly bookings, use user preferences
        bookingData.preferredTime = formData.preferredTime;
        bookingData.preferredDaysOfWeek = formData.preferredDaysOfWeek;
        bookingData.endDate = formData.endDate || undefined;
      }

      onBook(bookingData);
    } else {
      // For regular amenities, create one-time booking
      onBook({
        bookingType: BookingType.ONE_TIME,
        targetDate: formData.targetDate,
        targetTime: formData.targetTime,
        partySize: formData.partySize
      });
    }
  };

  const availableDaysOfWeek = getAvailableDaysOfWeek();

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => {
      const newDaysOfWeek = prev.preferredDaysOfWeek.includes(day)
        ? prev.preferredDaysOfWeek.filter(d => d !== day)
        : [...prev.preferredDaysOfWeek, day];
      
      // Reset preferred time when days change since available times might change
      return {
        ...prev,
        preferredDaysOfWeek: newDaysOfWeek,
        preferredTime: '' // Clear the selected time
      };
    });
  };

  const isEveryTimeAvailable = formData.recurrenceFrequency === RecurrenceFrequency.ALWAYS;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Book {amenity.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'fitness' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Type
                </label>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  This will automatically book you for this class when slots become available
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence
                </label>
                <select 
                  value={formData.recurrenceFrequency}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recurrenceFrequency: e.target.value as RecurrenceFrequency 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={RecurrenceFrequency.WEEKLY}>Weekly</option>
                  <option value={RecurrenceFrequency.ALWAYS}>Every time available</option>
                </select>
              </div>

              {!isEveryTimeAvailable && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Time slots based on selected days and {amenity.name}'s schedule
                    </p>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select a time</option>
                      {getTimeOptionsForSelectedDays().length > 0 ? (
                        getTimeOptionsForSelectedDays().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))
                      ) : (
                        <option value="" disabled>No time slots available</option>
                      )}
                    </select>
                    {getTimeOptionsForSelectedDays().length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        No time slots available for selected days. Please check the amenity's schedule or select different days.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Days
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Only days when {amenity.name} is available are shown
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDaysOfWeek.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(day.value)}
                          className={`px-3 py-2 text-sm rounded ${
                            formData.preferredDaysOfWeek.includes(day.value)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.label.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </>
              )}

              {isEveryTimeAvailable && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Every time available:</strong> The system will automatically book you for any available slot for this class, regardless of time or day.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Type
                </label>
                <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                  This will automatically book the specific time slot when it becomes available
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Time
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Available time slots for {amenity.name}
                </p>
                <select
                  value={formData.targetTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a time</option>
                  {getAllTimeOptions().length > 0 ? (
                    getAllTimeOptions().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))
                  ) : (
                    <option value="" disabled>No time slots available</option>
                  )}
                </select>
                {getAllTimeOptions().length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No time slots available for this amenity. Please check the amenity's schedule.
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Size
            </label>
            <input
              type="number"
              min="1"
              max={amenity.maxPartySize}
              value={formData.partySize}
              onChange={(e) => setFormData(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum party size: {amenity.maxPartySize}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create Booking Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AmenityCard: React.FC<{ 
  amenity: Amenity; 
  onBook: (amenity: Amenity) => void;
  type: 'fitness' | 'regular';
  userJobs: BookingJob[];
}> = ({ amenity, onBook, type, userJobs }) => {
  const [availability, setAvailability] = useState<AvailabilityStatus>({
    isAvailable: false,
    hasWaitlist: false,
    loading: true
  });
  const { userInfo } = useUser();

  useEffect(() => {
    if (userInfo?.email) {
      checkAvailability();
    }
  }, [userInfo?.email, amenity.id]);

  const checkAvailability = async () => {
    if (!userInfo?.email) return;

    try {
      setAvailability(prev => ({ ...prev, loading: true }));
      
      // Check availability for today and next few days
      const today = new Date();
      const dates = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      let nextAvailable = null;
      let nextWaitlist = null;
      let hasAvailability = false;
      let hasWaitlistAvailable = false;

      for (const date of dates) {
        try {
          const availabilityInfo = await amenitiesApi.checkAvailability(amenity.id, date, userInfo.email);
          if (availabilityInfo.available) {
            hasAvailability = true;
            if (!nextAvailable) {
              nextAvailable = date;
            }
          } else if (availabilityInfo.hasWaitlist) {
            hasWaitlistAvailable = true;
            if (!nextWaitlist) {
              nextWaitlist = date;
            }
          }
        } catch (error) {
          // Continue checking other dates if one fails
          console.warn(`Failed to check availability for ${date}:`, error);
        }
      }

      setAvailability({
        isAvailable: hasAvailability,
        hasWaitlist: hasWaitlistAvailable,
        nextAvailableSlot: nextAvailable || undefined,
        nextWaitlistSlot: nextWaitlist || undefined,
        loading: false
      });
    } catch (error) {
      console.error('Failed to check availability:', error);
      setAvailability({ isAvailable: false, hasWaitlist: false, loading: false });
    }
  };

  const hasActiveJob = userJobs.some(job => 
    job.amenityId === amenity.id && 
    (job.status === 'active' || job.status === 'paused')
  );

  const formatTime = (time: string) => {
    if (!time) return 'Invalid Time';
    
    try {
      // Handle different time formats that might come from the API
      let timeString = time;
      
      // If it's already in HH:MM format
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        }
      }
      
      // If it's in HH:MM:SS format
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
        timeString = timeString.substring(0, 5); // Extract HH:MM part
        return formatTime(timeString); // Recursive call with HH:MM format
      }
      
      // If it's a number (possibly representing hours)
      if (/^\d+$/.test(timeString)) {
        const hour = parseInt(timeString, 10);
        if (hour >= 0 && hour <= 23) {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour}:00 ${period}`;
        }
      }
      
      // Try to parse as a Date object (fallback)
      const date = new Date(`2000-01-01T${timeString}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      // If all else fails, return the original string
      return timeString;
    } catch (error) {
      console.warn('Failed to format time:', time, error);
      return time || 'Invalid Time';
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const formatDate = (dateString: string) => {
    // Fix timezone issue: add T12:00:00 to avoid timezone boundary problems
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Compare dates by their ISO string to avoid timezone issues
    const dateISO = dateString;
    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    if (dateISO === todayISO) {
      return 'Today';
    } else if (dateISO === tomorrowISO) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const getAvailabilityIndicator = () => {
    if (availability.loading) {
      return (
        <div className="flex items-center text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
          <span className="text-sm">Checking...</span>
        </div>
      );
    }

    if (availability.isAvailable) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">
            Available {availability.nextAvailableSlot && formatDate(availability.nextAvailableSlot)}
          </span>
        </div>
      );
    } else if (availability.hasWaitlist) {
      return (
        <div className="flex items-center text-blue-600">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">
            Waitlist available {availability.nextWaitlistSlot && formatDate(availability.nextWaitlistSlot)}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-orange-600">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">Limited availability</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {amenity.image && (
        <img 
          src={amenity.image} 
          alt={amenity.name}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{amenity.name}</h3>
          {hasActiveJob && (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Active</span>
            </div>
          )}
        </div>

        {/* Availability Status */}
        <div className="mb-3">
          {getAvailabilityIndicator()}
        </div>

        <div className="space-y-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
            <span>{amenity.schedulingIncrement} min slots</span>
          </div>
          
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-2 text-green-500" />
            <span>Max {amenity.maxPartySize} people • Capacity: {amenity.maxCapacity}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-4 w-4 mr-2 text-purple-500" />
              <span className="font-medium text-gray-700">Booking Limits</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-wide">Daily</span>
                <span className={`font-medium ${amenity.perDayLimit > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {amenity.perDayLimit > 0 ? `${amenity.perDayLimit} max` : 'Unlimited'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-wide">Weekly</span>
                <span className={`font-medium ${amenity.perWeekLimit > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {amenity.perWeekLimit > 0 ? `${amenity.perWeekLimit} max` : 'Unlimited'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available Hours:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            {amenity.availableHours.map((hours, index) => (
              <div key={index}>
                {getDayName(hours.day)}: {formatTime(hours.start_hour)} - {formatTime(hours.end_hour)}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onBook(amenity)}
          disabled={hasActiveJob}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            hasActiveJob
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : type === 'fitness'
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {hasActiveJob 
            ? 'Already Active' 
            : type === 'fitness' 
              ? 'Set Up Auto-Booking' 
              : 'Schedule Booking'
          }
        </button>
      </div>
    </div>
  );
};

export default function Amenities() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [userJobs, setUserJobs] = useState<BookingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedType, setSelectedType] = useState<'fitness' | 'regular' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { userInfo } = useUser();

  useEffect(() => {
    fetchAmenities();
    if (userInfo) {
      fetchUserJobs();
    }
  }, [userInfo]);

  const fetchAmenities = async () => {
    try {
      const data = await amenitiesApi.getAll();
      setAmenities(data);
    } catch (error) {
      console.error('Failed to fetch amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserJobs = async () => {
    if (!userInfo) return;
    
    try {
      const jobs = await bookingJobsApi.getUserJobs(userInfo.email);
      setUserJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch user jobs:', error);
    }
  };

  const categorizeAmenities = (): AmenityCategory[] => {
    const fitnessKeywords = [
      'yoga', 'pilates', 'zumba', 'spin', 'basketball', 'fitness', 
      'class', 'clinic', 'workout', 'exercise'
    ];
    
    const fitnessAmenities = amenities.filter(amenity =>
      fitnessKeywords.some(keyword => 
        amenity.name.toLowerCase().includes(keyword)
      )
    );

    const regularAmenities = amenities.filter(amenity =>
      !fitnessKeywords.some(keyword => 
        amenity.name.toLowerCase().includes(keyword)
      )
    );

    return [
      {
        title: 'Fitness Classes',
        description: 'Set up automatic bookings for fitness classes. The system will book you whenever slots become available.',
        amenities: fitnessAmenities,
        type: 'fitness'
      },
      {
        title: 'Amenity Reservations',
        description: 'Schedule specific time slots for amenities. The system will book the exact time when it becomes available.',
        amenities: regularAmenities,
        type: 'regular'
      }
    ];
  };

  const handleBookAmenity = (amenity: Amenity, type: 'fitness' | 'regular') => {
    setSelectedAmenity(amenity);
    setSelectedType(type);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    if (!userInfo || !selectedAmenity) return;

    try {
      const jobRequest: CreateBookingJobRequest = {
        userEmail: userInfo.email,
        userLastName: userInfo.lastName,
        userUnitNumber: userInfo.unitNumber,
        amenityId: selectedAmenity.id,
        amenityName: selectedAmenity.name,
        ...bookingData
      };

      await bookingJobsApi.create(jobRequest);
      
      setSuccessMessage(`Booking job created for ${selectedAmenity.name}!`);
      setSelectedAmenity(null);
      setSelectedType(null);
      
      // Refresh user jobs
      await fetchUserJobs();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to create booking job:', error);
      alert('Failed to create booking job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
          <p className="mt-1 text-sm text-gray-500">Loading amenities...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Please provide your information to view and book amenities
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to provide your information before you can access amenities.
          </p>
        </div>
      </div>
    );
  }

  const categories = categorizeAmenities();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set up automatic bookings for your favorite amenities and fitness classes
        </p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {categories.map((category) => (
        <div key={category.type} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{category.description}</p>
          </div>

          {category.amenities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.amenities.map((amenity) => (
                <AmenityCard
                  key={amenity.id}
                  amenity={amenity}
                  onBook={(amenity) => handleBookAmenity(amenity, category.type)}
                  type={category.type}
                  userJobs={userJobs}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">No {category.title.toLowerCase()} available</p>
            </div>
          )}
        </div>
      ))}

      {selectedAmenity && selectedType && (
        <BookingModal
          amenity={selectedAmenity}
          isOpen={true}
          onClose={() => {
            setSelectedAmenity(null);
            setSelectedType(null);
          }}
          onBook={handleBookingSubmit}
          type={selectedType}
        />
      )}
    </div>
  );
} 