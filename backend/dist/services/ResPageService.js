"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResPageService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const date_fns_tz_1 = require("date-fns-tz");
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
class ResPageService {
    constructor() {
        this.CAMPAIGN_ID = '42dba40a50910a23a43548b2302f86ce';
        this.BASE_URL = 'https://app.respage.com/public';
        // Cache for amenities to minimize API calls
        this.amenitiesCache = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        // Garbage data to avoid tracing
        this.FAKE_EMAIL = 'placeholder@tempmail.org';
        this.FAKE_UNIT_NUMBER = '999';
        this.FAKE_LAST_NAME = 'Smith';
        this.axiosInstance = axios_1.default.create({
            baseURL: this.BASE_URL,
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en,en-GB;q=0.9,hi;q=0.8,zh-CN;q=0.7,zh;q=0.6',
                'cache-control': 'no-cache',
                'content-type': 'application/json; charset=utf-8',
                'dnt': '1',
                'if-modified-since': '0',
                'origin': 'https://rp-webchat-client.netlify.app',
                'pragma': 'no-cache',
                'referer': 'https://rp-webchat-client.netlify.app/',
                'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'sec-fetch-storage-access': 'active',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
            }
        });
    }
    async getAmenities() {
        // Check cache first to minimize API calls
        if (this.amenitiesCache && (Date.now() - this.amenitiesCache.timestamp) < this.CACHE_DURATION) {
            logger_1.logger.info(`Retrieved ${this.amenitiesCache.data.length} amenities from cache`);
            return this.amenitiesCache.data;
        }
        try {
            const response = await this.axiosInstance.get(`/reservation-resources?campaign_id=${this.CAMPAIGN_ID}`);
            // Update cache
            this.amenitiesCache = {
                data: response.data.data,
                timestamp: Date.now()
            };
            logger_1.logger.info(`Retrieved ${response.data.data.length} amenities from API`);
            return response.data.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch amenities:', error);
            throw new Error('Failed to fetch amenities from ResPage API');
        }
    }
    async getAmenityById(amenityId) {
        const amenities = await this.getAmenities();
        return amenities.find(a => a._id === amenityId);
    }
    async getDateFilters(amenityId, email, startDate) {
        try {
            // Use fake email for preliminary checks to avoid tracing
            const response = await this.axiosInstance.get(`/reservation-resources/${amenityId}/date-filters?start_date=${startDate}&email=${this.FAKE_EMAIL}`);
            return response.data.data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get date filters for amenity ${amenityId}:`, error);
            throw new Error('Failed to get date filters');
        }
    }
    async getResidentId(lastName, unitNumber) {
        try {
            const response = await this.axiosInstance.get(`/residents/name-unit-match?campaign_id=${this.CAMPAIGN_ID}&last_name=${lastName}&unit_number=${unitNumber}`);
            if (!response.data.data) {
                throw new Error('Resident not found');
            }
            logger_1.logger.info(`Found resident ID: ${response.data.data}`);
            return response.data.data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get resident ID for ${lastName}, unit ${unitNumber}:`, error);
            throw new Error('Failed to verify resident information');
        }
    }
    async checkBlacklist(email, amenityId) {
        try {
            // Always use real email for blacklist checks as they are user-specific
            const response = await this.axiosInstance.get(`/reservation-resources/blacklist?email=${email}&resource_id=${amenityId}`);
            const isBlacklisted = response.data.data;
            if (isBlacklisted) {
                logger_1.logger.warn(`User ${email} is blacklisted for amenity ${amenityId}`);
            }
            return isBlacklisted;
        }
        catch (error) {
            logger_1.logger.error(`Failed to check blacklist for ${email}:`, error);
            throw new Error('Failed to check blacklist status');
        }
    }
    async getAvailableTimeSlots(amenityId, date, partySize, unitNumber, useRealData = false) {
        try {
            const unitNumberToUse = useRealData ? unitNumber : this.FAKE_UNIT_NUMBER;
            const url = `/reservation-resources/${amenityId}/time-slots?date=${date}&party_size=${partySize}&unit_number=${unitNumberToUse}`;
            logger_1.logger.debug(`🔍 Getting time slots from URL: ${this.BASE_URL}${url}`);
            const response = await this.axiosInstance.get(url);
            const availableSlots = response.data.data.availableTimeSlots || [];
            logger_1.logger.debug(`✅ Found ${availableSlots.length} available time slots.`);
            return availableSlots.filter((slot) => slot.available_capacity > 0);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get time slots for amenity ${amenityId} on ${date}:`, error);
            throw new Error('Failed to get available time slots');
        }
    }
    async getFullAvailabilityInfo(amenityId, date, partySize, unitNumber, useRealData = false) {
        try {
            const unitNumberToUse = useRealData ? unitNumber : this.FAKE_UNIT_NUMBER;
            const url = `/reservation-resources/${amenityId}/time-slots?date=${date}&party_size=${partySize}&unit_number=${unitNumberToUse}`;
            logger_1.logger.debug(`🔍 Getting full availability info from URL: ${this.BASE_URL}${url}`);
            const response = await this.axiosInstance.get(url);
            const allTimeSlots = response.data.data.availableTimeSlots || [];
            const availableSlots = allTimeSlots.filter((slot) => slot.available_capacity > 0);
            // Check if amenity has waitlist enabled using cached amenities
            const amenity = await this.getAmenityById(amenityId);
            const waitlistEnabled = amenity?.waitlist_enabled || false;
            // If no available slots but waitlist is enabled and there are time slots defined, waitlist is available
            const hasWaitlist = waitlistEnabled && availableSlots.length === 0 && allTimeSlots.length > 0;
            return {
                hasAvailableSlots: availableSlots.length > 0,
                hasWaitlist,
                timeSlots: allTimeSlots
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get availability info for amenity ${amenityId} on ${date}:`, error);
            throw new Error('Failed to get availability information');
        }
    }
    async makeReservation(request, residentId, termsOfUse) {
        try {
            // Making reservation with debug logging enabled
            // First check if user is blacklisted
            const isBlacklisted = await this.checkBlacklist(request.email, request.amenityId);
            if (isBlacklisted) {
                return {
                    success: false,
                    errorMessage: 'User is blacklisted for this amenity'
                };
            }
            // Get available time slots - use real email for final booking check
            const timeSlots = await this.getAvailableTimeSlots(request.amenityId, request.targetDate, request.partySize, request.unitNumber, true);
            // Find the closest available time slot to the requested time
            const targetDateTime = new Date(`${request.targetDate}T${request.targetTime}:00`);
            const availableSlot = this.findBestTimeSlot(timeSlots, targetDateTime);
            if (!availableSlot) {
                return {
                    success: false,
                    errorMessage: 'No available time slots found for the requested date and time'
                };
            }
            // Calculate end time based on the slot
            const startTime = new Date(availableSlot.timeslot);
            const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // Assume 1 hour duration
            const timeZone = 'America/Los_Angeles';
            const reservationData = {
                data: {
                    reservation: {
                        campaign_id: this.CAMPAIGN_ID,
                        name: request.lastName,
                        party_size: request.partySize,
                        resource_id: request.amenityId,
                        resident_id: residentId,
                        unit_number: request.unitNumber,
                        email: request.email,
                        start_time: (0, date_fns_tz_1.format)((0, date_fns_tz_1.toZonedTime)(startTime, timeZone), "yyyy-MM-dd'T'HH:mm:ss"),
                        end_time: (0, date_fns_tz_1.format)((0, date_fns_tz_1.toZonedTime)(endTime, timeZone), "yyyy-MM-dd'T'HH:mm:ss"),
                        source: 'amenity_booking_widget'
                    },
                    agreement: {
                        agreement_text: termsOfUse,
                        agreement_type: 'explicit',
                        agreed_to_terms: true
                    }
                },
                timezone: 'America/Los_Angeles'
            };
            logger_1.logger.debug(`🌐 MAKING RESERVATION REQUEST:`);
            logger_1.logger.debug(`📍 URL: ${this.axiosInstance.defaults.baseURL}/reservations`);
            logger_1.logger.debug(`📦 Payload:`, JSON.stringify(reservationData, null, 2));
            logger_1.logger.debug(`🔧 Available slot used:`, availableSlot);
            logger_1.logger.debug(`⏰ Calculated times: start=${startTime.toISOString()}, end=${endTime.toISOString()}`);
            // Debug output for detailed reservation information
            const response = await this.axiosInstance.post('/reservations', reservationData);
            logger_1.logger.info(`Successfully created reservation: ${response.data.data._id}`);
            return {
                success: true,
                reservationId: response.data.data._id,
                accessCode: response.data.data.access_code
            };
        }
        catch (error) {
            logger_1.logger.error(`❌ FAILED TO MAKE RESERVATION for ${request.email}:`, error.message);
            if (error.response) {
                logger_1.logger.error(`📋 Response status: ${error.response.status}`);
                logger_1.logger.error(`📋 Response data:`, JSON.stringify(error.response.data, null, 2));
                logger_1.logger.error(`📋 Response headers:`, error.response.headers);
            }
            else if (error.request) {
                logger_1.logger.error(`📋 Request made but no response received:`, error.request);
            }
            let errorMessage = 'Failed to create reservation';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            else if (error.message) {
                errorMessage = error.message;
            }
            return {
                success: false,
                errorMessage
            };
        }
    }
    findBestTimeSlot(timeSlots, targetDateTime) {
        if (timeSlots.length === 0) {
            return null;
        }
        // Sort by how close they are to the target time
        const sortedSlots = timeSlots.sort((a, b) => {
            const diffA = Math.abs(new Date(a.timeslot).getTime() - targetDateTime.getTime());
            const diffB = Math.abs(new Date(b.timeslot).getTime() - targetDateTime.getTime());
            return diffA - diffB;
        });
        return sortedSlots[0];
    }
    async isAmenityAvailable(amenityId, date, unitNumber) {
        // Use garbage data to check availability to avoid tracking
        const timeSlots = await this.getAvailableTimeSlots(amenityId, date, 1, unitNumber, false);
        return timeSlots.length > 0;
    }
}
exports.ResPageService = ResPageService;
//# sourceMappingURL=ResPageService.js.map