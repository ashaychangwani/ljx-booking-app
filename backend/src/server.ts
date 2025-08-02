import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './database';
import { SchedulerService } from './services/SchedulerService';
import { logger } from './utils/logger';

// Import routes
import amenitiesRouter from './routes/amenities';
import bookingJobsRouter from './routes/booking-jobs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize scheduler
const scheduler = new SchedulerService();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    scheduler: scheduler.getTaskStatus()
  });
});

// API routes
app.use('/api/amenities', amenitiesRouter);
app.use('/api/booking-jobs', bookingJobsRouter);

// Scheduler management endpoints
app.post('/api/scheduler/trigger', async (req, res) => {
  try {
    await scheduler.triggerBookingProcessing();
    res.json({
      success: true,
      message: 'Booking processing triggered successfully'
    });
  } catch (error) {
    logger.error('Failed to trigger booking processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger booking processing'
    });
  }
});

app.get('/api/scheduler/status', (req, res) => {
  res.json({
    success: true,
    data: scheduler.getTaskStatus()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  scheduler.stop();
  
  setTimeout(async () => {
    try {
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Start scheduler
    scheduler.start();
    logger.info('Scheduler started successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 