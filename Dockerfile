# Multi-stage build for full-stack application

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install nginx for serving frontend and curl for health checks
RUN apk add --no-cache nginx curl

# Set working directory
WORKDIR /app

# Copy root package.json for npm scripts
COPY package*.json ./

# Install root dependencies (concurrently for npm run dev)
RUN npm install --production

# Create directory structure
RUN mkdir -p /app/backend /app/frontend/dist /app/data /app/logs

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy backend source files (needed for any runtime dependencies)
COPY backend/src ./backend/src

# Copy built frontend to nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy the current database (the larger one from backend seems more recent)
COPY backend/database.sqlite ./data/database.sqlite

# Copy environment and configuration files
COPY frontend/package.json ./frontend/
COPY backend/tsconfig.json ./backend/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=/app/data/database.sqlite
ENV FRONTEND_URL=http://localhost:3000

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh

# Start nginx in background for frontend
nginx -g "daemon off;" &

# Start backend in foreground (this will show npm logs)
cd /app && exec npm start
EOF

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health && curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["/app/start.sh"]