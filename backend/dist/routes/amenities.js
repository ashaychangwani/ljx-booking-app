"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ResPageService_1 = require("../services/ResPageService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const resPageService = new ResPageService_1.ResPageService();
// GET /api/amenities - Get all available amenities
router.get('/', async (req, res) => {
    try {
        const amenities = await resPageService.getAmenities();
        // Transform the data to include only relevant information for the frontend
        const transformedAmenities = amenities.map(amenity => ({
            id: amenity._id,
            name: amenity.name,
            schedulingIncrement: amenity.scheduling_increment,
            availableHours: amenity.available_hours,
            maxPartySize: amenity.max_party_size,
            maxCapacity: amenity.max_capacity,
            timezone: amenity.timezone,
            perDayLimit: amenity.per_day_limit,
            perWeekLimit: amenity.per_week_limit,
            image: amenity.image,
            waitlistEnabled: amenity.waitlist_enabled,
            disabledDates: amenity.disabled_dates
        }));
        res.json({
            success: true,
            data: transformedAmenities
        });
        logger_1.logger.info(`Returned ${transformedAmenities.length} amenities to client`);
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch amenities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch amenities'
        });
    }
});
// GET /api/amenities/:id/availability - Check availability for specific amenity
router.get('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, email, partySize = '1' } = req.query;
        if (!date || !email) {
            return res.status(400).json({
                success: false,
                error: 'Date and email are required'
            });
        }
        // Get detailed availability information including waitlist status - use real email for user-facing checks
        const availabilityInfo = await resPageService.getFullAvailabilityInfo(id, date, parseInt(partySize), email, true);
        // Also check if the date is valid (not blocked, within range, etc.)
        const isDateValid = await resPageService.isAmenityAvailable(id, date, email);
        res.json({
            success: true,
            data: {
                available: availabilityInfo.hasAvailableSlots && isDateValid,
                hasWaitlist: availabilityInfo.hasWaitlist && isDateValid,
                timeSlots: availabilityInfo.timeSlots
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to check amenity availability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check amenity availability'
        });
    }
});
// GET /api/amenities/:id/time-slots - Get available time slots for specific date
router.get('/:id/time-slots', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, partySize = '1', email } = req.query;
        if (!date || !email) {
            return res.status(400).json({
                success: false,
                error: 'Date and email are required'
            });
        }
        // Use real email for user-facing availability checks
        const timeSlots = await resPageService.getAvailableTimeSlots(id, date, parseInt(partySize), email, true);
        res.json({
            success: true,
            data: timeSlots
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch time slots:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch time slots'
        });
    }
});
exports.default = router;
//# sourceMappingURL=amenities.js.map