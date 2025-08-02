import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { bookingJobsApi, schedulerApi } from '@/services/api';
import { BookingJob, BookingStatus } from '@/types';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  TicketIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { userInfo } = useUser();
  const [bookingJobs, setBookingJobs] = useState<BookingJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userInfo) {
      fetchBookingJobs();
    }
  }, [userInfo]);

  const fetchBookingJobs = async () => {
    if (!userInfo) return;
    
    try {
      const jobs = await bookingJobsApi.getUserJobs(userInfo.email);
      setBookingJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch booking jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      await bookingJobsApi.pause(jobId);
      await fetchBookingJobs();
    } catch (error) {
      console.error('Failed to pause job:', error);
    }
  };

  const handleResumeJob = async (jobId: string) => {
    try {
      await bookingJobsApi.resume(jobId);
      await fetchBookingJobs();
    } catch (error) {
      console.error('Failed to resume job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this booking job?')) return;
    
    try {
      await bookingJobsApi.delete(jobId);
      await fetchBookingJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleTriggerScheduler = async () => {
    try {
      await schedulerApi.trigger();
      alert('Scheduler triggered successfully!');
      await fetchBookingJobs();
    } catch (error) {
      console.error('Failed to trigger scheduler:', error);
      alert('Failed to trigger scheduler');
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
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (!userInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Please provide your information to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Loading your booking jobs...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const activeJobs = bookingJobs.filter(job => job.status === BookingStatus.ACTIVE);
  const completedJobs = bookingJobs.filter(job => job.status === BookingStatus.COMPLETED);
  const totalSuccessfulBookings = bookingJobs.reduce((sum, job) => sum + job.successfulBookings, 0);

  // Get all reservations from all booking jobs
  const allReservations = bookingJobs
    .flatMap(job => 
      job.bookedSlots.map(slot => ({
        ...slot,
        amenityName: job.amenityName,
        jobId: job.id,
        jobStatus: job.status
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {userInfo.lastName}! Here's what's happening with your bookings.
          </p>
        </div>
        <button
          onClick={handleTriggerScheduler}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Trigger Scheduler
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeJobs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">{completedJobs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TicketIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Reservations</dt>
                  <dd className="text-lg font-medium text-gray-900">{allReservations.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Booking Jobs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Booking Jobs</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your latest booking automation jobs and their status.
          </p>
        </div>
        
        {bookingJobs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No booking jobs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first automated booking.
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {bookingJobs.slice(0, 5).map((job) => (
              <li key={job.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getStatusIcon(job.status)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{job.amenityName}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Type: {job.bookingType}</span>
                        <span>Success: {job.successfulBookings}</span>
                        <span>Failed: {job.failedAttempts}</span>
                        {job.lastSuccessfulBooking && (
                          <span>Last: {new Date(job.lastSuccessfulBooking).toLocaleDateString()}</span>
                        )}
                      </div>
                      {job.errorMessage && (
                        <p className="mt-1 text-sm text-red-600">{job.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {job.status === BookingStatus.ACTIVE ? (
                      <button
                        onClick={() => handlePauseJob(job.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Pause job"
                      >
                        <PauseIcon className="h-4 w-4" />
                      </button>
                    ) : job.status === BookingStatus.PAUSED ? (
                      <button
                        onClick={() => handleResumeJob(job.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Resume job"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete job"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reservations */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Reservations</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            All your confirmed bookings and their details.
          </p>
        </div>
        
        {allReservations.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your confirmed bookings will appear here once they're made.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>Amenity</div>
                <div>Date</div>
                <div>Time</div>
                <div>Reservation ID</div>
                <div>Access Code</div>
                <div>Booked</div>
              </div>
            </div>
            <ul role="list" className="divide-y divide-gray-200">
              {allReservations.slice(0, 10).map((reservation) => (
                <li key={reservation.id} className="px-4 py-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{reservation.amenityName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(reservation.bookedDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{reservation.bookedTime}</span>
                    </div>
                    
                    <div>
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {reservation.reservationId.slice(-8)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-mono text-green-700 bg-green-100 px-2 py-1 rounded">
                        {reservation.accessCode}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(reservation.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {allReservations.length > 10 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Showing latest 10 reservations out of {allReservations.length} total
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 