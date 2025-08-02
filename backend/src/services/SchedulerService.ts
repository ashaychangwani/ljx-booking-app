import * as cron from 'node-cron';
import { BookingService } from './BookingService';
import { logger } from '../utils/logger';

export class SchedulerService {
  private bookingService: BookingService;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.bookingService = new BookingService();
  }

  start(): void {
    logger.info('Starting scheduler service...');

    // Process booking jobs every 15 minutes
    const bookingTask = cron.schedule('*/15 * * * *', async () => {
      logger.debug('Running scheduled booking job processing...');
      try {
        await this.bookingService.processActiveBookingJobs();
      } catch (error) {
        logger.error('Error processing booking jobs:', error);
      }
    }, {
      scheduled: false
    });

    // Health check every hour
    const healthTask = cron.schedule('0 * * * *', () => {
      logger.info(`Scheduler health check - Active tasks: ${this.tasks.size}`);
    }, {
      scheduled: false
    });

    // Start tasks
    bookingTask.start();
    healthTask.start();

    this.tasks.set('booking-processor', bookingTask);
    this.tasks.set('health-check', healthTask);

    logger.info('Scheduler service started successfully');
  }

  stop(): void {
    logger.info('Stopping scheduler service...');

    this.tasks.forEach((task, name) => {
      task.stop();
      logger.debug(`Stopped task: ${name}`);
    });

    this.tasks.clear();
    logger.info('Scheduler service stopped');
  }

  // Manual trigger for testing
  async triggerBookingProcessing(): Promise<void> {
    logger.warn('🚀 MANUALLY TRIGGERING BOOKING JOB PROCESSING...');
    try {
      await this.bookingService.processActiveBookingJobs();
      logger.warn('✅ MANUAL BOOKING PROCESSING COMPLETED');
    } catch (error) {
      logger.error('❌ ERROR IN MANUAL BOOKING PROCESSING:', error);
      throw error;
    }
  }

  getTaskStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    
    this.tasks.forEach((task, name) => {
      // Check if task exists in our map (means it's running)
      status[name] = true;
    });

    return status;
  }
} 