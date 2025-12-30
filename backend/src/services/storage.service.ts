/**
 * Storage Service
 * Handles file upload/download with MinIO (S3-compatible)
 */

import { Client } from 'minio';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Create MinIO client
const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: parseInt(env.MINIO_PORT, 10),
  useSSL: env.MINIO_USE_SSL === 'true',
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

const BUCKET_NAME = env.MINIO_BUCKET;

/**
 * Initialize storage - create bucket if not exists
 */
export const initStorage = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);

    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`MinIO bucket created: ${BUCKET_NAME}`);

      // Set public read policy for videos
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      logger.info('MinIO bucket policy set to public read');
    } else {
      logger.info(`MinIO bucket exists: ${BUCKET_NAME}`);
    }
  } catch (error) {
    logger.error('MinIO initialization error:', error);
    throw error;
  }
};

/**
 * Upload file to storage
 */
export const uploadFile = async (
  filePath: string,
  folder: string = 'uploads'
): Promise<string> => {
  try {
    const fileName = `${folder}/${uuidv4()}${path.extname(filePath)}`;
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);

    // Detect content type
    const contentType = getContentType(filePath);

    await minioClient.putObject(BUCKET_NAME, fileName, fileStream, stats.size, {
      'Content-Type': contentType,
    });

    const url = await getFileUrl(fileName);
    logger.info(`File uploaded: ${fileName}`);

    return url;
  } catch (error) {
    logger.error('File upload error:', error);
    throw error;
  }
};

/**
 * Upload buffer to storage
 */
export const uploadBuffer = async (
  buffer: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<string> => {
  try {
    await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
      'Content-Type': contentType,
    });

    const url = await getFileUrl(fileName);
    logger.info(`Buffer uploaded: ${fileName}`);

    return url;
  } catch (error) {
    logger.error('Buffer upload error:', error);
    throw error;
  }
};

/**
 * Upload video file
 */
export const uploadVideo = async (filePath: string, orderId: string): Promise<string> => {
  const fileName = `videos/${orderId}.mp4`;
  const fileStream = fs.createReadStream(filePath);
  const stats = fs.statSync(filePath);

  await minioClient.putObject(BUCKET_NAME, fileName, fileStream, stats.size, {
    'Content-Type': 'video/mp4',
  });

  const url = await getFileUrl(fileName);
  logger.info(`Video uploaded: ${fileName}`);

  return url;
};

/**
 * Upload thumbnail
 */
export const uploadThumbnail = async (
  filePath: string,
  orderId: string
): Promise<string> => {
  const fileName = `thumbnails/${orderId}.jpg`;
  const fileStream = fs.createReadStream(filePath);
  const stats = fs.statSync(filePath);

  await minioClient.putObject(BUCKET_NAME, fileName, fileStream, stats.size, {
    'Content-Type': 'image/jpeg',
  });

  const url = await getFileUrl(fileName);
  logger.info(`Thumbnail uploaded: ${fileName}`);

  return url;
};

/**
 * Delete file from storage
 */
export const deleteFile = async (fileName: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
    logger.info(`File deleted: ${fileName}`);
  } catch (error) {
    logger.error('File delete error:', error);
    throw error;
  }
};

/**
 * Get file URL
 */
export const getFileUrl = async (fileName: string): Promise<string> => {
  // In production with CDN, return CDN URL
  if (process.env.CDN_URL) {
    return `${process.env.CDN_URL}/${fileName}`;
  }

  // For development/local
  const protocol = env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  return `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;
};

/**
 * Get presigned URL for temporary access
 */
export const getPresignedUrl = async (
  fileName: string,
  expirySeconds: number = 3600
): Promise<string> => {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, fileName, expirySeconds);
  } catch (error) {
    logger.error('Presigned URL error:', error);
    throw error;
  }
};

/**
 * Get content type from file extension
 */
const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
  };

  return contentTypes[ext] || 'application/octet-stream';
};

/**
 * List files in folder
 */
export const listFiles = async (prefix: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);

    stream.on('data', (obj) => {
      if (obj.name) {
        files.push(obj.name);
      }
    });

    stream.on('end', () => resolve(files));
    stream.on('error', reject);
  });
};
