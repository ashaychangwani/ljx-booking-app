"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const BookingService_1 = require("./BookingService");
const logger_1 = require("../utils/logger");
class SchedulerService {
    constructor() {
        this.tasks = new Map();
        this.bookingService = new BookingService_1.BookingService();
    }
    start() {
        logger_1.logger.info('Starting scheduler service...');
        // Process booking jobs every 15 minutes
        const bookingTask = cron.schedule('*/15 * * * *', async () => {
            logger_1.logger.debug('Running scheduled booking job processing...');
            try {
                await this.bookingService.processActiveBookingJobs();
            }
            catch (error) {
                logger_1.logger.error('Error processing booking jobs:', error);
            }
        }, {
            scheduled: false
        });
        // Health check every hour
        const healthTask = cron.schedule('0 * * * *', () => {
            logger_1.logger.info(`Scheduler health check - Active tasks: ${this.tasks.size}`);
        }, {
            scheduled: false
        });
        // Start tasks
        bookingTask.start();
        healthTask.start();
        this.tasks.set('booking-processor', bookingTask);
        this.tasks.set('health-check', healthTask);
        logger_1.logger.info('Scheduler service started successfully');
    }
    stop() {
        logger_1.logger.info('Stopping scheduler service...');
        this.tasks.forEach((task, name) => {
            task.stop();
            logger_1.logger.debug(`Stopped task: ${name}`);
        });
        this.tasks.clear();
        logger_1.logger.info('Scheduler service stopped');
    }
    // Manual trigger for testing
    async triggerBookingProcessing() {
        logger_1.logger.warn('🚀 MANUALLY TRIGGERING BOOKING JOB PROCESSING...');
        try {
            await this.bookingService.processActiveBookingJobs();
            logger_1.logger.warn('✅ MANUAL BOOKING PROCESSING COMPLETED');
        }
        catch (error) {
            logger_1.logger.error('❌ ERROR IN MANUAL BOOKING PROCESSING:', error);
            throw error;
        }
    }
    getTaskStatus() {
        const status = {};
        this.tasks.forEach((task, name) => {
            // Check if task exists in our map (means it's running)
            status[name] = true;
        });
        return status;
    }
}
exports.SchedulerService = SchedulerService;
//# sourceMappingURL=SchedulerService.js.map