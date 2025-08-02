"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
const SchedulerService_1 = require("./services/SchedulerService");
const logger_1 = require("./utils/logger");
// Import routes
const amenities_1 = __importDefault(require("./routes/amenities"));
const booking_jobs_1 = __importDefault(require("./routes/booking-jobs"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Initialize scheduler
const scheduler = new SchedulerService_1.SchedulerService();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        scheduler: scheduler.getTaskStatus()
    });
});
// API routes
app.use('/api/amenities', amenities_1.default);
app.use('/api/booking-jobs', booking_jobs_1.default);
// Scheduler management endpoints
app.post('/api/scheduler/trigger', async (req, res) => {
    try {
        await scheduler.triggerBookingProcessing();
        res.json({
            success: true,
            message: 'Booking processing triggered successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to trigger booking processing:', error);
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
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error:', err);
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
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
    scheduler.stop();
    setTimeout(async () => {
        try {
            await (0, database_1.closeDatabase)();
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
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
        await (0, database_1.initializeDatabase)();
        logger_1.logger.info('Database initialized successfully');
        // Start scheduler
        scheduler.start();
        logger_1.logger.info('Scheduler started successfully');
        // Start Express server
        app.listen(PORT, () => {
            logger_1.logger.info(`Server is running on port ${PORT}`);
            logger_1.logger.info(`Health check available at: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map