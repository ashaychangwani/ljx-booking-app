import { Router, Request, Response } from 'express';
import { ResPageService } from '../services/ResPageService';
import { logger } from '../utils/logger';

const router = Router();
const resPageService = new ResPageService();

// GET /api/amenities - Get all available amenities
router.get('/', async (req: Request, res: Response) => {
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

    logger.info(`Returned ${transformedAmenities.length} amenities to client`);
  } catch (error) {
    logger.error('Failed to fetch amenities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch amenities'
    });
  }
});

// GET /api/amenities/:id/availability - Check availability for specific amenity
router.get('/:id/availability', async (req: Request, res: Response) => {
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
    const availabilityInfo = await resPageService.getFullAvailabilityInfo(
      id,
      date as string,
      parseInt(partySize as string),
      email as string,
      true
    );

    // Also check if the date is valid (not blocked, within range, etc.)
    const isDateValid = await resPageService.isAmenityAvailable(
      id,
      date as string,
      email as string
    );

    res.json({
      success: true,
      data: {
        available: availabilityInfo.hasAvailableSlots && isDateValid,
        hasWaitlist: availabilityInfo.hasWaitlist && isDateValid,
        timeSlots: availabilityInfo.timeSlots
      }
    });

  } catch (error) {
    logger.error('Failed to check amenity availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check amenity availability'
    });
  }
});

// GET /api/amenities/:id/time-slots - Get available time slots for specific date
router.get('/:id/time-slots', async (req: Request, res: Response) => {
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
    const timeSlots = await resPageService.getAvailableTimeSlots(
      id,
      date as string,
      parseInt(partySize as string),
      email as string,
      true
    );

    res.json({
      success: true,
      data: timeSlots
    });

  } catch (error) {
    logger.error('Failed to fetch time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time slots'
    });
  }
});

export default router; 