// src/shared/storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config';

const s3 = new S3Client({
  endpoint:        config.S3_ENDPOINT,
  region:          config.S3_REGION,
  credentials: {
    accessKeyId:     config.S3_ACCESS_KEY_ID,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // required for MinIO
});

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      config.S3_BUCKET,
    Key:         key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}