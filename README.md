# LJX Booking Automation

A comprehensive Docker-based application for automating amenity bookings at La Jolla Crossroads. The system provides a modern web interface to set up one-time or recurring bookings that automatically reserve your preferred amenities as soon as they become available.

## Features

### 🎯 Core Functionality
- **One-time Bookings**: Schedule bookings for specific dates and times
- **Recurring Bookings**: Set up automatic daily, weekly, monthly, or "always" bookings
- **Real-time Monitoring**: Track booking success rates and system status
- **User Management**: Secure resident verification through ResPage API
- **Modern UI**: Beautiful, responsive React interface with Tailwind CSS

### 🏢 Supported Amenities
- 360 Bowling Alley
- 360 Pool Table
- LJX Fitness Center: Infrared Sauna
- LJX Movie Theatre
- LJX Upstairs Studio: Pilates Sculpt
- LJX Upstairs Studio: Yoga Flow
- Park 360: Basketball Fundamentals Clinic
- Park 360: Spin Classes
- Park 360: Zumba

### 🚀 Technical Features
- **Automated Scheduling**: Cron-based job processing every 5 minutes
- **Smart Booking Logic**: Finds closest available time slots to your preferences
- **Comprehensive Logging**: Full audit trail of all booking attempts
- **Health Monitoring**: Built-in health checks and status monitoring
- **Docker Deployment**: Easy containerized deployment with docker compose

## Architecture

### Backend (Node.js/TypeScript)
- **Express.js** API server with TypeScript
- **TypeORM** with SQLite database for job persistence
- **ResPage API Integration** for booking and resident verification
- **Node-cron** for scheduled job processing
- **Winston** for comprehensive logging
- **Rate limiting** and security middleware

### Frontend (React/TypeScript)
- **React 18** with TypeScript and Vite
- **Tailwind CSS** for modern styling
- **React Query** for efficient data fetching
- **React Router** for navigation
- **React Hook Form** for form management
- **Heroicons** for beautiful icons

### Infrastructure
- **Docker & Docker Compose** for easy deployment
- **Nginx** for frontend serving with optimized caching
- **SQLite** database with volume persistence
- **Health checks** and auto-restart policies

## Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Git

### Option 1: Pre-built Docker Image (Recommended)
```bash
# Pull and run the pre-built image (includes database)
docker pull ashayc/ljx-booking-app:latest
docker run -d -p 3000:3000 -p 3001:3001 ashayc/ljx-booking-app:latest

# Or use with Docker Compose (see Docker Deployment section below)
```

### Option 2: Build from Source
```bash
# Clone the repository
git clone <repository-url>
cd ljx-book

# Build and start the application
npm run docker:build
npm run docker:up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Development Setup
```bash
# Install dependencies for both frontend and backend
npm install

# Start development servers
npm run dev

# Backend will run on http://localhost:3001
# Frontend will run on http://localhost:3000
```

## Docker Deployment

### Pre-built Multi-Platform Image
The application is available as a pre-built Docker image that supports both AMD64 and ARM64 architectures:
- **Docker Hub**: `ashayc/ljx-booking-app:latest`
- **Includes**: Complete application with current database state
- **Platforms**: linux/amd64, linux/arm64

### Adding to Existing Docker Compose
Add this service to your existing `docker-compose.yml`:

```yaml
services:
  ljx-booking-app:
    profiles: ["default"]
    container_name: ljx-booking-app
    image: ashayc/ljx-booking-app:latest
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=/app/data/database.sqlite
      - FRONTEND_URL=http://localhost:3100
    ports:
      - "3100:3000"  # Frontend (adjust if port conflicts)
      - "3101:3001"  # Backend API
    volumes:
      - ljx-booking-data:/app/data
      - ljx-booking-logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - your_network_name  # Replace with your network

volumes:
  ljx-booking-data:
  ljx-booking-logs:
```

### Building and Pushing New Images
Use the provided script to build and push multi-platform images:

```bash
# Option 1: Use npm script (recommended)
npm run docker:build-push

# Option 2: Use script directly
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh your-dockerhub-username

# Option 3: With a specific tag
./scripts/build-and-push.sh your-dockerhub-username v1.2.0

# Option 4: Quick multi-platform build (no script)
npm run docker:multiplatform
```

The script will:
- ✅ Build for both AMD64 and ARM64 architectures
- ✅ Include your current database state
- ✅ Push to Docker Hub
- ✅ Optionally test the image locally

### Quick Commands Summary
```bash
# Development
npm run dev                         # Start dev servers
npm run build                       # Build both frontend and backend

# Local Docker (✅ AMD64 + ARM64 support)
npm run docker:build               # Build with docker-compose (multi-platform)
npm run docker:up                  # Run with docker-compose

# Production Docker Images (✅ GUARANTEED AMD64 SUPPORT)
npm run docker:build-push          # Build and push multi-platform (latest tag)
npm run docker:build-push-tag      # Build and push multi-platform (custom tag)
npm run docker:amd64-only          # AMD64 only build and push
npm run docker:force-multiplatform # Force multi-platform build

# Pull and run pre-built image (✅ AMD64 compatible)
docker pull ashayc/ljx-booking-app:latest
docker run -d -p 3000:3000 -p 3001:3001 ashayc/ljx-booking-app:latest
```

## Usage Guide

### 1. User Registration
1. Navigate to http://localhost:3000
2. Click "Create Account"
3. Enter your information (must match ResPage records):
   - First Name
   - Last Name
   - Email
   - Unit Number
4. The system will verify your residency through ResPage API

### 2. Creating Booking Jobs

#### One-time Booking
- Select an amenity
- Choose "One-time booking"
- Pick your desired date and time
- Set party size
- The system will attempt to book as soon as slots become available

#### Recurring Booking
- Select an amenity
- Choose "Recurring booking"
- Set frequency (Daily/Weekly/Monthly/Always)
- Choose preferred time and days of week
- Optionally set an end date
- The system will continuously attempt bookings based on your schedule

### 3. Managing Bookings
- View all your booking jobs in the dashboard
- Pause/resume jobs as needed
- Monitor success rates and error messages
- Delete completed or unwanted jobs

## API Documentation

### Core Endpoints

#### Amenities
- `GET /api/amenities` - List all available amenities
- `GET /api/amenities/:id/availability` - Check availability for specific date
- `GET /api/amenities/:id/time-slots` - Get available time slots

#### Users
- `POST /api/users` - Register new user
- `GET /api/users/:id` - Get user details
- `GET /api/users/email/:email` - Find user by email

#### Booking Jobs
- `POST /api/booking-jobs` - Create new booking job
- `GET /api/booking-jobs/user/:userId` - Get user's booking jobs
- `PUT /api/booking-jobs/:id` - Update booking job
- `DELETE /api/booking-jobs/:id` - Delete booking job
- `POST /api/booking-jobs/:id/pause` - Pause job
- `POST /api/booking-jobs/:id/resume` - Resume job

#### System
- `GET /health` - Health check
- `POST /api/scheduler/trigger` - Manually trigger booking processing
- `GET /api/scheduler/status` - Get scheduler status

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=database.sqlite
LOG_LEVEL=info
```

#### Frontend
```env
VITE_API_URL=http://localhost:3001/api
```

### Docker Configuration
The application uses Docker Compose with:
- Backend service on port 3001
- Frontend service on port 3000
- Persistent volumes for database and logs
- Health checks and restart policies

## Booking Logic

### How It Works
1. **Scheduler runs every 5 minutes** checking for active booking jobs
2. **For each job**, the system:
   - Checks if the amenity is available for booking
   - Verifies user isn't blacklisted
   - Finds the best available time slot
   - Attempts to make the reservation
   - Updates job status and statistics

### Booking Strategies
- **One-time**: Attempts booking until successful or date passes
- **Daily**: Books for the next available day
- **Weekly**: Books for the same day next week
- **Monthly**: Books for the same day next month
- **Always**: Continuously books available slots within the next 7 days

### Error Handling
- Automatic retries for transient failures
- Job deactivation after 10 consecutive failures
- Comprehensive error logging and user notifications

## Data Models

### User
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  unitNumber: string;
  residentId: string; // From ResPage verification
  isActive: boolean;
}
```

### Booking Job
```typescript
interface BookingJob {
  id: string;
  user: User;
  amenityId: string;
  amenityName: string;
  bookingType: 'one_time' | 'recurring';
  status: 'active' | 'paused' | 'completed' | 'failed';
  
  // One-time booking fields
  targetDate?: Date;
  targetTime?: string;
  
  // Recurring booking fields
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'always';
  preferredTime?: string;
  preferredDaysOfWeek?: number[];
  endDate?: Date;
  
  // Statistics
  successfulBookings: number;
  failedAttempts: number;
  lastAttempt?: Date;
  lastSuccessfulBooking?: Date;
  errorMessage?: string;
}
```

## Monitoring & Logging

### Health Monitoring
- Backend health endpoint at `/health`
- Frontend health check via nginx
- Scheduler status monitoring
- Database connectivity checks

### Logging
- Comprehensive Winston logging
- Separate log files for errors and general logs
- Request/response logging
- Booking attempt audit trail

### Metrics Tracked
- Total booking jobs (active/completed/failed)
- Success rate per amenity
- System uptime and scheduler status
- User activity and registration stats

## Security Features

- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **CORS configuration** for frontend access
- **Helmet.js** security headers
- **Resident verification** through ResPage API
- **No sensitive data storage** (leverages ResPage for authentication)

## Troubleshooting

### Common Issues

#### Backend won't start
- Check if port 3001 is available
- Verify database permissions
- Check logs for detailed error messages

#### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check CORS configuration
- Verify API_URL environment variable

#### Bookings not working
- Check scheduler status via `/api/scheduler/status`
- Verify ResPage API connectivity
- Check user's blacklist status
- Review booking job error messages

### Debug Commands
```bash
# View backend logs
docker compose logs backend

# View frontend logs
docker compose logs frontend

# Check scheduler status
curl http://localhost:3001/api/scheduler/status

# Manual trigger booking processing
curl -X POST http://localhost:3001/api/scheduler/trigger

# Health check
curl http://localhost:3001/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal use at La Jolla Crossroads. Please respect the ResPage API terms of service and use responsibly.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs for error details
3. Create an issue with reproduction steps

---

**Note**: This application automates booking requests to the ResPage system. Please use responsibly and in accordance with La Jolla Crossroads policies. The system respects all existing booking limits and restrictions. 