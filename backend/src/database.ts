import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { BookingJob, BookedSlot } from './entities/BookingJob';
import { logger } from './utils/logger';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_URL || 'database.sqlite',
  synchronize: true, // Set to false in production
  logging: process.env.NODE_ENV !== 'production',
  entities: [BookingJob, BookedSlot],
  migrations: [],
  subscribers: []
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Failed to close database connection:', error);
  }
} 