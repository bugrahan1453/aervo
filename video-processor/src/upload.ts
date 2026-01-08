/**
 * MinIO Upload Utility
 */

import { Client as MinioClient } from 'minio';
import fs from 'fs/promises';
import path from 'path';

const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'emlakdrone_admin',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const BUCKET = process.env.MINIO_BUCKET || 'emlakdrone-videos';

export async function uploadToMinio(
  orderId: string,
  filePath: string,
  contentType: string,
  isThumbnail: boolean = false
): Promise<string> {
  const fileName = isThumbnail
    ? `thumbnails/${orderId}.jpg`
    : `videos/${orderId}.mp4`;

  await minioClient.fPutObject(BUCKET, fileName, filePath, {
    'Content-Type': contentType,
  });

  // Return public URL (adjust based on your setup)
  return `https://emlakdrone.com/storage/${fileName}`;
}
