# Aervo Video Processor - FFmpeg Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install FFmpeg and dependencies
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    ghostscript

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create directories
RUN mkdir -p /app/storage/temp

EXPOSE 3002

# Start processor
CMD ["node", "dist/index.js"]
