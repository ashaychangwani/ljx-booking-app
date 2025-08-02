import React, { useState, useEffect } from 'react';
import { bookingJobsApi, schedulerApi } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import { 
  BookingJob, 
  BookedSlot,
  BookingType, 
  BookingStatus, 
  RecurrenceFrequency 
} from '@/types';
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface JobCardProps {
  job: BookingJob;
  onUpdate: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePause = async () => {
    setIsLoading(true);
    try {
      await bookingJobsApi.pause(job.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to pause job:', error);
      alert('Failed to pause job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      await bookingJobsApi.resume(job.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to resume job:', error);
      alert('Failed to resume job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this booking job? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await bookingJobsApi.delete(job.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this booked slot? This will make the slot available for booking again.')) {
      return;
    }

    setIsLoading(true);
    try {
      await bookingJobsApi.deleteSlot(slotId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete slot:', error);
      alert('Failed to delete slot. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case BookingStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case BookingStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.ACTIVE:
        return <CheckCircleIcon className="h-4 w-4" />;
      case BookingStatus.PAUSED:
        return <PauseIcon className="h-4 w-4" />;
      case BookingStatus.COMPLETED:
        return <CheckCircleIcon className="h-4 w-4" />;
      case BookingStatus.FAILED:
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatSlotDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    
    try {
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
      return timeString;
    } catch {
      return timeString;
    }
  };

  const getDayNames = (days?: number[]) => {
    if (!days || days.length === 0) return 'N/A';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };

  const getRecurrenceDisplay = (frequency?: RecurrenceFrequency) => {
    switch (frequency) {
      case RecurrenceFrequency.DAILY: return 'Daily';
      case RecurrenceFrequency.WEEKLY: return 'Weekly';
      case RecurrenceFrequency.MONTHLY: return 'Monthly';
      case RecurrenceFrequency.ALWAYS: return 'Every time available';
      default: return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.amenityName}</h3>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {getStatusIcon(job.status)}
                <span className="ml-1 capitalize">{job.status}</span>
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {job.bookingType === BookingType.ONE_TIME ? 'One-time' : 'Recurring'}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            {job.status === BookingStatus.ACTIVE && <button onClick={handlePause} disabled={isLoading} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full" title="Pause"><PauseIcon className="h-5 w-5" /></button>}
            {job.status === BookingStatus.PAUSED && <button onClick={handleResume} disabled={isLoading} className="p-2 text-green-600 hover:bg-green-50 rounded-full" title="Resume"><PlayIcon className="h-5 w-5" /></button>}
            <button onClick={handleDeleteJob} disabled={isLoading} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Delete"><TrashIcon className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {job.bookingType === BookingType.ONE_TIME ? (
            <>
              <div className="flex items-center text-sm"><CalendarIcon className="h-4 w-4 mr-2 text-blue-500" /><span>Target Date: {job.targetDate ? new Date(job.targetDate).toLocaleDateString() : 'N/A'}</span></div>
              <div className="flex items-center text-sm"><ClockIcon className="h-4 w-4 mr-2 text-green-500" /><span>Target Time: {formatTime(job.targetTime)}</span></div>
            </>
          ) : (
            <>
              <div className="flex items-center text-sm"><ArrowPathIcon className="h-4 w-4 mr-2 text-purple-500" /><span>Recurrence: {getRecurrenceDisplay(job.recurrenceFrequency)}</span></div>
              {job.recurrenceFrequency !== RecurrenceFrequency.ALWAYS && (
                <>
                  <div className="flex items-center text-sm"><ClockIcon className="h-4 w-4 mr-2 text-green-500" /><span>Preferred Time: {formatTime(job.preferredTime)}</span></div>
                  <div className="flex items-center text-sm"><CalendarIcon className="h-4 w-4 mr-2 text-blue-500" /><span>Preferred Days: {getDayNames(job.preferredDaysOfWeek)}</span></div>
                  {job.endDate && <div className="flex items-center text-sm"><CalendarIcon className="h-4 w-4 mr-2 text-orange-500" /><span>End Date: {new Date(job.endDate).toLocaleDateString()}</span></div>}
                </>
              )}
            </>
          )}
          <div className="flex items-center text-sm"><UserGroupIcon className="h-4 w-4 mr-2 text-indigo-500" /><span>Party Size: {job.partySize}</span></div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Successful Bookings:</span><span className="ml-2 font-medium text-green-600">{job.successfulBookings}</span></div>
            <div><span className="text-gray-500">Failed Attempts:</span><span className="ml-2 font-medium text-red-600">{job.failedAttempts}</span></div>
          </div>
          {job.lastSuccessfulBooking && <div className="text-sm"><span className="text-gray-500">Last Success:</span><span className="ml-2 text-gray-700">{formatDate(job.lastSuccessfulBooking)}</span></div>}
          {job.lastAttempt && <div className="text-sm"><span className="text-gray-500">Last Attempt:</span><span className="ml-2 text-gray-700">{formatDate(job.lastAttempt)}</span></div>}
          {job.errorMessage && <div className="text-sm"><span className="text-gray-500">Last Error:</span><span className="ml-2 text-red-600">{job.errorMessage}</span></div>}
        </div>
        
        {job.bookedSlots && job.bookedSlots.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left text-sm font-medium text-gray-700 flex justify-between items-center">
              <span>Booked Slots ({job.bookedSlots.length})</span>
              {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                {job.bookedSlots.map(slot => (
                  <div key={slot.id} className="p-2 bg-gray-100 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium">{formatSlotDate(slot.bookedDate)} at {formatTime(slot.bookedTime)}</p>
                      <p className="text-xs text-gray-500">Access Code: {slot.accessCode} | Res ID: {slot.reservationId}</p>
                    </div>
                    <button onClick={() => handleDeleteSlot(slot.id)} disabled={isLoading} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200"><span className="text-xs text-gray-500">Created: {formatDate(job.createdAt)}</span></div>
      </div>
    </div>
  );
};

export default function BookingJobs() {
  const [jobs, setJobs] = useState<BookingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringScheduler, setTriggeringScheduler] = useState(false);
  const { userInfo } = useUser();

  useEffect(() => {
    if (userInfo) {
      fetchJobs();
    }
  }, [userInfo]);

  const fetchJobs = async () => {
    if (!userInfo) return;
    
    try {
      setLoading(true);
      const data = await bookingJobsApi.getUserJobs(userInfo.email);
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScheduler = async () => {
    try {
      setTriggeringScheduler(true);
      await schedulerApi.trigger();
      alert('Scheduler triggered successfully! Your jobs will be processed shortly.');
      // Refresh jobs after a short delay to show any updates
      setTimeout(fetchJobs, 2000);
    } catch (error) {
      console.error('Failed to trigger scheduler:', error);
      alert('Failed to trigger scheduler. Please try again.');
    } finally {
      setTriggeringScheduler(false);
    }
  };

  const getJobStats = () => {
    const activeJobs = jobs.filter(job => job.status === BookingStatus.ACTIVE).length;
    const pausedJobs = jobs.filter(job => job.status === BookingStatus.PAUSED).length;
    const totalSuccessful = jobs.reduce((sum, job) => sum + job.successfulBookings, 0);
    const totalFailed = jobs.reduce((sum, job) => sum + job.failedAttempts, 0);

    return { activeJobs, pausedJobs, totalSuccessful, totalFailed };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Loading your booking jobs...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Booking Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Please provide your information to view your booking jobs
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to provide your information before you can access your booking jobs.
          </p>
        </div>
      </div>
    );
  }

  const stats = getJobStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your automated booking jobs
          </p>
        </div>
        
        <button
          onClick={handleTriggerScheduler}
          disabled={triggeringScheduler}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {triggeringScheduler ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Run Jobs Now
            </>
          )}
        </button>
      </div>

      {/* Statistics Cards */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeJobs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PauseIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paused Jobs</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pausedJobs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Successful</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalSuccessful}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Failed</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalFailed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No booking jobs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first booking job from the Amenities page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onUpdate={fetchJobs} />
          ))}
        </div>
      )}
    </div>
  );
} 