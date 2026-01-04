# Aervo Video Processor - FFmpeg Dockerfile

FROM node:20-alpine

# Install FFmpeg and dependencies
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    ghostscript

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application
COPY . .

# Build TypeScript
RUN npm run build

# Create directories
RUN mkdir -p /app/storage/temp

EXPOSE 3002

# Start processor
CMD ["node", "dist/index.js"]
