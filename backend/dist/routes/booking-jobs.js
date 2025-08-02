"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BookingService_1 = require("../services/BookingService");
const BookingJob_1 = require("../entities/BookingJob");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const bookingService = new BookingService_1.BookingService();
// POST /api/booking-jobs - Create a new booking job
router.post('/', async (req, res) => {
    try {
        const { userEmail, userLastName, userUnitNumber, amenityId, amenityName, bookingType, targetDate, targetTime, recurrenceFrequency, preferredTime, preferredDaysOfWeek, endDate, partySize } = req.body;
        // Validate required fields
        if (!userEmail || !userLastName || !userUnitNumber || !amenityId || !amenityName || !bookingType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userEmail, userLastName, userUnitNumber, amenityId, amenityName, bookingType'
            });
        }
        // Validate booking type specific fields
        if (bookingType === BookingJob_1.BookingType.ONE_TIME) {
            if (!targetDate || !targetTime) {
                return res.status(400).json({
                    success: false,
                    error: 'One-time bookings require targetDate and targetTime'
                });
            }
        }
        else if (bookingType === BookingJob_1.BookingType.RECURRING) {
            if (!recurrenceFrequency || !preferredTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Recurring bookings require recurrenceFrequency and preferredTime'
                });
            }
        }
        const jobData = {
            userEmail,
            userLastName,
            userUnitNumber,
            amenityId,
            amenityName,
            bookingType,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            targetTime,
            recurrenceFrequency,
            preferredTime,
            preferredDaysOfWeek,
            endDate: endDate ? new Date(endDate) : undefined,
            partySize
        };
        const bookingJob = await bookingService.createBookingJob(jobData);
        res.status(201).json({
            success: true,
            data: {
                id: bookingJob.id,
                amenityName: bookingJob.amenityName,
                bookingType: bookingJob.bookingType,
                status: bookingJob.status,
                targetDate: bookingJob.targetDate,
                targetTime: bookingJob.targetTime,
                recurrenceFrequency: bookingJob.recurrenceFrequency,
                preferredTime: bookingJob.preferredTime,
                preferredDaysOfWeek: bookingJob.preferredDaysOfWeek,
                endDate: bookingJob.endDate,
                partySize: bookingJob.partySize,
                isActive: bookingJob.isActive,
                createdAt: bookingJob.createdAt
            }
        });
        logger_1.logger.info(`Created booking job ${bookingJob.id} for ${userEmail} - ${amenityName}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to create booking job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking job'
        });
    }
});
// GET /api/booking-jobs/user/:email - Get all booking jobs for a user
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const bookingJobs = await bookingService.getUserBookingJobs(email);
        const transformedJobs = bookingJobs.map(job => ({
            id: job.id,
            amenityId: job.amenityId,
            amenityName: job.amenityName,
            bookingType: job.bookingType,
            status: job.status,
            targetDate: job.targetDate,
            targetTime: job.targetTime,
            recurrenceFrequency: job.recurrenceFrequency,
            preferredTime: job.preferredTime,
            preferredDaysOfWeek: job.preferredDaysOfWeek,
            endDate: job.endDate,
            partySize: job.partySize,
            successfulBookings: job.successfulBookings,
            failedAttempts: job.failedAttempts,
            lastAttempt: job.lastAttempt,
            lastSuccessfulBooking: job.lastSuccessfulBooking,
            errorMessage: job.errorMessage,
            isActive: job.isActive,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            bookedSlots: job.bookedSlots.map(slot => ({
                id: slot.id,
                reservationId: slot.reservationId,
                accessCode: slot.accessCode,
                bookedDate: slot.bookedDate,
                bookedTime: slot.bookedTime,
                createdAt: slot.createdAt
            }))
        }));
        res.json({
            success: true,
            data: transformedJobs
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch booking jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking jobs'
        });
    }
});
// PUT /api/booking-jobs/:id - Update a booking job
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, targetDate, targetTime, recurrenceFrequency, preferredTime, preferredDaysOfWeek, endDate, partySize, isActive } = req.body;
        const updates = {};
        if (status !== undefined)
            updates.status = status;
        if (targetDate !== undefined)
            updates.targetDate = targetDate ? new Date(targetDate) : null;
        if (targetTime !== undefined)
            updates.targetTime = targetTime;
        if (recurrenceFrequency !== undefined)
            updates.recurrenceFrequency = recurrenceFrequency;
        if (preferredTime !== undefined)
            updates.preferredTime = preferredTime;
        if (preferredDaysOfWeek !== undefined)
            updates.preferredDaysOfWeek = preferredDaysOfWeek;
        if (endDate !== undefined)
            updates.endDate = endDate ? new Date(endDate) : null;
        if (partySize !== undefined)
            updates.partySize = partySize;
        if (isActive !== undefined)
            updates.isActive = isActive;
        const updatedJob = await bookingService.updateBookingJob(id, updates);
        if (!updatedJob) {
            return res.status(404).json({
                success: false,
                error: 'Booking job not found'
            });
        }
        res.json({
            success: true,
            data: {
                id: updatedJob.id,
                amenityName: updatedJob.amenityName,
                bookingType: updatedJob.bookingType,
                status: updatedJob.status,
                targetDate: updatedJob.targetDate,
                targetTime: updatedJob.targetTime,
                recurrenceFrequency: updatedJob.recurrenceFrequency,
                preferredTime: updatedJob.preferredTime,
                preferredDaysOfWeek: updatedJob.preferredDaysOfWeek,
                endDate: updatedJob.endDate,
                partySize: updatedJob.partySize,
                successfulBookings: updatedJob.successfulBookings,
                failedAttempts: updatedJob.failedAttempts,
                lastAttempt: updatedJob.lastAttempt,
                lastSuccessfulBooking: updatedJob.lastSuccessfulBooking,
                errorMessage: updatedJob.errorMessage,
                isActive: updatedJob.isActive,
                updatedAt: updatedJob.updatedAt
            }
        });
        logger_1.logger.info(`Updated booking job ${id}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to update booking job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking job'
        });
    }
});
// DELETE /api/booking-jobs/:id - Delete a booking job
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await bookingService.deleteBookingJob(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Booking job not found'
            });
        }
        res.json({
            success: true,
            message: 'Booking job deleted successfully'
        });
        logger_1.logger.info(`Deleted booking job ${id}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to delete booking job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete booking job'
        });
    }
});
// POST /api/booking-jobs/:id/pause - Pause a booking job
router.post('/:id/pause', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedJob = await bookingService.updateBookingJob(id, {
            status: BookingJob_1.BookingStatus.PAUSED,
            isActive: false
        });
        if (!updatedJob) {
            return res.status(404).json({
                success: false,
                error: 'Booking job not found'
            });
        }
        res.json({
            success: true,
            message: 'Booking job paused successfully',
            data: {
                id: updatedJob.id,
                status: updatedJob.status,
                isActive: updatedJob.isActive
            }
        });
        logger_1.logger.info(`Paused booking job ${id}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to pause booking job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to pause booking job'
        });
    }
});
// POST /api/booking-jobs/:id/resume - Resume a booking job
router.post('/:id/resume', async (req, res) => {
    try {
        const job = await bookingService.updateBookingJob(req.params.id, { status: BookingJob_1.BookingStatus.ACTIVE, isActive: true });
        if (!job) {
            return res.status(404).json({ success: false, error: 'Booking job not found' });
        }
        res.json({ success: true, data: job });
    }
    catch (error) {
        logger_1.logger.error('Failed to resume job:', error);
        res.status(500).json({ success: false, error: 'Failed to resume job' });
    }
});
// DELETE /api/booking-jobs/slots/:slotId - Delete a booked slot
router.delete('/slots/:slotId', async (req, res) => {
    try {
        const success = await bookingService.deleteBookedSlot(req.params.slotId);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Booked slot not found' });
        }
        res.json({ success: true, message: 'Booked slot deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete booked slot:', error);
        res.status(500).json({ success: false, error: 'Failed to delete booked slot' });
    }
});
exports.default = router;
//# sourceMappingURL=booking-jobs.js.map