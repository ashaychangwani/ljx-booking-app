"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const BookingJob_1 = require("./entities/BookingJob");
const logger_1 = require("./utils/logger");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'sqlite',
    database: process.env.DATABASE_URL || 'database.sqlite',
    synchronize: true, // Set to false in production
    logging: process.env.NODE_ENV !== 'production',
    entities: [BookingJob_1.BookingJob, BookingJob_1.BookedSlot],
    migrations: [],
    subscribers: []
});
async function initializeDatabase() {
    try {
        await exports.AppDataSource.initialize();
        logger_1.logger.info('Database connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize database:', error);
        throw error;
    }
}
async function closeDatabase() {
    try {
        if (exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            logger_1.logger.info('Database connection closed');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to close database connection:', error);
    }
}
//# sourceMappingURL=database.js.map