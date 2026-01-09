/**
 * Video Renderer
 * Google Maps Static API + FFmpeg based rendering engine
 */

import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const TILE_SIZE = 640;
const ZOOM_LEVEL = 19; // High zoom for satellite imagery

interface RenderOptions {
  orderId: string;
  latitude: number;
  longitude: number;
  duration: number; // seconds
  resolution: string; // '1080p' | '4K'
  cameraAngles: string[]; // ['spiral', 'zoom_in', 'orbit', 'flyover']
  hasLogo?: boolean;
  hasCustomMusic?: boolean;
  musicPath?: string;
}

export class VideoRenderer {
  private workDir: string;
  private framesDir: string;
  private framerate = 30;

  constructor(workDir: string = '/tmp/video-processing') {
    this.workDir = workDir;
    this.framesDir = path.join(workDir, 'frames');
  }

  /**
   * Main rendering function
   */
  async render(options: RenderOptions): Promise<string> {
    console.log(`🎬 Starting render for order ${options.orderId}`);

    // Create work directories
    await this.setupDirectories();

    // Generate frames based on camera movements
    const totalFrames = options.duration * this.framerate;
    await this.generateFrames(options, totalFrames);

    // Create video from frames
    const videoPath = await this.createVideoFromFrames(options);

    // Add music if requested
    if (options.hasCustomMusic && options.musicPath) {
      await this.addMusic(videoPath, options.musicPath);
    }

    // Add logo if requested
    if (options.hasLogo) {
      await this.addLogo(videoPath);
    }

    console.log(`✅ Render complete: ${videoPath}`);
    return videoPath;
  }

  /**
   * Setup working directories
   */
  private async setupDirectories() {
    try {
      await fs.mkdir(this.workDir, { recursive: true });
      await fs.mkdir(this.framesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  /**
   * Generate video frames
   */
  private async generateFrames(options: RenderOptions, totalFrames: number) {
    console.log(`📸 Generating ${totalFrames} frames...`);

    for (let i = 0; i < totalFrames; i++) {
      const progress = i / totalFrames;

      // Calculate camera position based on angle
      const { lat, lng, zoom } = this.calculateCameraPosition(
        options.latitude,
        options.longitude,
        progress,
        options.cameraAngles[0] // Use first camera angle
      );

      // Fetch satellite tile from Google Maps Static API
      const imageBuffer = await this.fetchStaticMapImage(lat, lng, zoom);

      // Save frame
      const framePath = path.join(this.framesDir, `frame_${String(i).padStart(5, '0')}.jpg`);
      await fs.writeFile(framePath, imageBuffer);

      if (i % 30 === 0) {
        console.log(`📸 Frame ${i}/${totalFrames} (${Math.round(progress * 100)}%)`);
      }
    }
  }

  /**
   * Calculate camera position for each frame
   */
  private calculateCameraPosition(
    baseLat: number,
    baseLng: number,
    progress: number, // 0-1
    cameraAngle: string
  ): { lat: number; lng: number; zoom: number } {
    switch (cameraAngle) {
      case 'spiral':
        // Spiral descent
        const radius = 0.005 * (1 - progress); // Decreasing radius
        const angle = progress * Math.PI * 4; // 2 full rotations
        return {
          lat: baseLat + radius * Math.cos(angle),
          lng: baseLng + radius * Math.sin(angle),
          zoom: ZOOM_LEVEL - Math.floor((1 - progress) * 3), // Zoom in
        };

      case 'zoom_in':
        // Simple zoom in
        return {
          lat: baseLat,
          lng: baseLng,
          zoom: ZOOM_LEVEL - Math.floor((1 - progress) * 5),
        };

      case 'orbit':
        // 360-degree orbit
        const orbitAngle = progress * Math.PI * 2;
        const orbitRadius = 0.003;
        return {
          lat: baseLat + orbitRadius * Math.cos(orbitAngle),
          lng: baseLng + orbitRadius * Math.sin(orbitAngle),
          zoom: ZOOM_LEVEL - 2,
        };

      case 'flyover':
        // Linear flyover
        return {
          lat: baseLat + (progress - 0.5) * 0.01,
          lng: baseLng,
          zoom: ZOOM_LEVEL - 1,
        };

      default:
        return { lat: baseLat, lng: baseLng, zoom: ZOOM_LEVEL };
    }
  }

  /**
   * Fetch static map image from Google Maps API
   */
  private async fetchStaticMapImage(lat: number, lng: number, zoom: number): Promise<Buffer> {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${TILE_SIZE}x${TILE_SIZE}&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error fetching map tile:', error);
      throw error;
    }
  }

  /**
   * Create video from frames using FFmpeg
   */
  private createVideoFromFrames(options: RenderOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.workDir, `${options.orderId}.mp4`);
      const inputPattern = path.join(this.framesDir, 'frame_%05d.jpg');

      // Resolution settings
      const resolutionMap: Record<string, string> = {
        '1080p': '1920x1080',
        '4K': '3840x2160',
      };

      const resolution = resolutionMap[options.resolution] || '1920x1080';

      ffmpeg()
        .input(inputPattern)
        .inputOptions(['-y']) // Allow overwrite
        .inputFPS(this.framerate)
        .videoCodec('libx264')
        .size(resolution)
        .outputOptions([
          '-pix_fmt yuv420p',
          '-preset medium',
          '-crf 23',
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('🎥 FFmpeg command:', cmd);
        })
        .on('progress', (progress) => {
          console.log(`🎬 Encoding: ${Math.round(progress.percent || 0)}%`);
        })
        .on('stderr', (stderrLine) => {
          console.log('FFmpeg stderr:', stderrLine);
        })
        .on('end', () => {
          console.log(`✅ Video created: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (error, stdout, stderr) => {
          console.error('❌ FFmpeg error:', error);
          console.error('FFmpeg stdout:', stdout);
          console.error('FFmpeg stderr:', stderr);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Add background music to video
   */
  private async addMusic(videoPath: string, musicPath: string): Promise<void> {
    console.log('🎵 Adding music...');

    const outputPath = videoPath.replace('.mp4', '_with_music.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(musicPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-strict experimental',
          '-shortest',
        ])
        .output(outputPath)
        .on('end', async () => {
          // Replace original with music version
          await fs.unlink(videoPath);
          await fs.rename(outputPath, videoPath);
          console.log('✅ Music added');
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ Music add error:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Add logo overlay to video
   */
  private async addLogo(videoPath: string): Promise<void> {
    console.log('🏷️  Adding logo...');

    // TODO: Implement logo overlay using FFmpeg overlay filter
    // For now, skip if logo file doesn't exist
    console.log('ℹ️  Logo feature - coming soon');
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '1280x720',
        })
        .on('end', () => {
          console.log(`✅ Thumbnail created: ${thumbnailPath}`);
          resolve(thumbnailPath);
        })
        .on('error', (error) => {
          console.error('❌ Thumbnail error:', error);
          reject(error);
        });
    });
  }

  /**
   * Cleanup temporary files
   */
  async cleanup() {
    try {
      await fs.rm(this.framesDir, { recursive: true, force: true });
      console.log('🧹 Cleanup complete');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
