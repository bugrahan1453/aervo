/**
 * EmlakDrone Video Processor
 * FFmpeg-based video rendering service
 *
 * This service listens to the video-processing queue and renders videos
 * using Google Maps satellite imagery and FFmpeg
 */

import { Worker, Job } from 'bullmq';
import { VideoRenderer } from './renderer';
import { uploadToMinio } from './upload';
import axios from 'axios';

// Queue connection
const queueConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

/**
 * Update order status in backend API
 */
const updateOrderStatus = async (
  orderId: string,
  status: string,
  videoUrl?: string,
  thumbnailUrl?: string,
  error?: string
) => {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    await axios.post(`${backendUrl}/api/orders/${orderId}/status`, {
      status,
      videoUrl,
      thumbnailUrl,
      error,
    });
  } catch (err) {
    console.error(`Failed to update order ${orderId} status:`, err);
  }
};

/**
 * Process video rendering job
 *
 * Steps:
 * 1. Fetch satellite imagery from Google Maps
 * 2. Generate camera path based on selected angles
 * 3. Create video frames using FFmpeg
 * 4. Apply transitions, music, and overlays
 * 5. Upload to MinIO storage
 * 6. Update order status in database
 */
const processVideoJob = async (job: Job) => {
  const {
    orderId,
    latitude,
    longitude,
    duration,
    resolution,
    cameraAngles,
    hasLogo,
    hasCustomMusic,
  } = job.data;

  console.log(`🎬 Processing video for order ${orderId}`);
  console.log(`📍 Location: ${latitude}, ${longitude}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📹 Resolution: ${resolution}`);
  console.log(`🎥 Camera angles: ${cameraAngles.join(', ')}`);

  try {
    await job.updateProgress(10);
    await updateOrderStatus(orderId, 'PROCESSING');

    // Initialize video renderer
    const renderer = new VideoRenderer(
      latitude,
      longitude,
      duration,
      resolution,
      cameraAngles,
      hasLogo,
      hasCustomMusic
    );

    // Step 1: Fetch satellite tiles
    console.log(`📡 Fetching satellite imagery...`);
    await job.updateProgress(20);
    await renderer.fetchSatelliteTiles();

    // Step 2: Render video
    console.log(`🎬 Rendering video...`);
    await job.updateProgress(50);
    const { videoPath, thumbnailPath } = await renderer.renderVideo((progress) => {
      // Update job progress (50-90%)
      const jobProgress = 50 + Math.floor(progress * 40);
      job.updateProgress(jobProgress);
    });

    // Step 3: Upload to MinIO
    console.log(`☁️  Uploading to storage...`);
    await job.updateProgress(90);

    const videoUrl = await uploadToMinio(videoPath, `videos/${orderId}.mp4`);
    const thumbnailUrl = await uploadToMinio(thumbnailPath, `thumbnails/${orderId}.jpg`);

    // Step 4: Cleanup temporary files
    await renderer.cleanup();

    // Step 5: Update order status
    await updateOrderStatus(orderId, 'COMPLETED', videoUrl, thumbnailUrl);
    await job.updateProgress(100);

    console.log(`✅ Video rendered successfully for order ${orderId}`);
    console.log(`📹 Video URL: ${videoUrl}`);
    console.log(`🖼️  Thumbnail URL: ${thumbnailUrl}`);

    return {
      success: true,
      orderId,
      videoUrl,
      thumbnailUrl,
    };
  } catch (error: any) {
    console.error(`❌ Video rendering failed for order ${orderId}:`, error);

    // Update order status to failed
    await updateOrderStatus(orderId, 'FAILED', undefined, undefined, error.message);

    throw error;
  }
};

// Create worker
const videoWorker = new Worker('video-processing', processVideoJob, {
  connection: queueConnection,
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '2', 10),
});

videoWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

videoWorker.on('failed', (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error);
});

videoWorker.on('error', (error) => {
  console.error('Worker error:', error);
});

console.log(`
╔════════════════════════════════════════╗
║                                        ║
║  🎬 EMLAKDRONE VIDEO PROCESSOR STARTED ║
║                                        ║
║   Waiting for video rendering jobs...  ║
║                                        ║
╚════════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await videoWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await videoWorker.close();
  process.exit(0);
});
