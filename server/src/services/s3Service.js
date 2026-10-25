import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'cloudcloset-atelier-assets-2026';
const REGION = process.env.AWS_REGION || 'ap-southeast-2';

let s3ClientInstance = null;

/**
 * Returns the S3Client singleton using AWS SDK v3.
 *
 * Uses the default AWS credential provider chain:
 * 1. Explicit environment credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) if provided.
 * 2. When running on Amazon EC2, automatically retrieves temporary security credentials
 *    from the EC2 IAM Instance Profile via IMDSv2 metadata service.
 * 3. Never requires hardcoded credentials or permanent access keys on EC2.
 */
export function getS3Client() {
  if (!s3ClientInstance) {
    const config = { region: process.env.AWS_REGION || REGION };

    // If explicit development credentials are provided in environment:
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN || undefined
      };
    }
    // Otherwise, AWS SDK v3 automatically relies on the EC2 IAM Instance Profile.

    s3ClientInstance = new S3Client(config);
  }
  return s3ClientInstance;
}

export function resetS3Client() {
  s3ClientInstance = null;
}

export function getBucketName() {
  return process.env.AWS_S3_BUCKET_NAME || BUCKET_NAME;
}

export function getRegion() {
  return process.env.AWS_REGION || REGION;
}

// In-memory mock store for local development/testing when AWS credentials are not configured
const localMockS3Store = new Map();

export function getMockS3Store() {
  return localMockS3Store;
}

/**
 * Checks whether an object exists in the S3 bucket using HeadObjectCommand.
 * Prevents unintended overwrites of existing archival imagery.
 */
export async function checkObjectExists(s3Key) {
  if (!s3Key) return false;

  const isAwsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'production'
  );

  if (!isAwsConfigured) {
    return localMockS3Store.has(s3Key);
  }

  try {
    const client = getS3Client();
    const command = new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key
    });
    await client.send(command);
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // Re-throw unexpected AWS/network errors for caller to handle
    throw err;
  }
}

/**
 * Uploads a validated product photograph to the private Amazon S3 bucket.
 * Bucket has Block Public Access enabled; images are stored securely with SSE-S3 AES-256 encryption.
 */
export async function uploadProductImage(fileBuffer, s3Key, mimeType, options = {}) {
  const isAwsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'production'
  );

  if (!isAwsConfigured) {
    localMockS3Store.set(s3Key, {
      buffer: fileBuffer,
      mimeType,
      uploadedAt: new Date()
    });
    return {
      bucket: getBucketName(),
      key: s3Key,
      url: `/mock-s3/${s3Key}`,
      isMock: true
    };
  }

  // Prevent accidental overwrite if requested
  if (options.preventOverwrite) {
    const alreadyExists = await checkObjectExists(s3Key);
    if (alreadyExists) {
      const err = new Error(`Object with key "${s3Key}" already exists in bucket "${getBucketName()}". Overwrite rejected.`);
      err.code = 'OBJECT_ALREADY_EXISTS';
      throw err;
    }
  }

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
    Metadata: {
      atelier: 'cloudcloset',
      uploaded_at: new Date().toISOString()
    }
  });

  await client.send(command);

  return {
    bucket: getBucketName(),
    key: s3Key,
    url: `s3://${getBucketName()}/${s3Key}`,
    isMock: false
  };
}

/**
 * Generates a short-lived presigned GET URL for secure client viewing from private S3.
 *
 * Expiration defaults to 3600 seconds (1 hour).
 * Handles missing keys or unavailable objects gracefully by returning null.
 */
export async function getPresignedViewUrl(s3Key, expiresInSeconds = 3600) {
  if (!s3Key) return null;

  const isAwsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'production'
  );

  if (!isAwsConfigured) {
    if (localMockS3Store.has(s3Key)) {
      return `/mock-s3/${s3Key}`;
    }
    return null;
  }

  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key
    });

    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.warn(`[S3 Warning] Could not generate presigned URL for key "${s3Key}":`, err.message);
    return null;
  }
}

/**
 * Deletes a product image from the Amazon S3 bucket.
 */
export async function deleteProductImage(s3Key) {
  if (!s3Key) return { success: false, reason: 'missing_key' };

  const isAwsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'production'
  );

  if (!isAwsConfigured) {
    localMockS3Store.delete(s3Key);
    return { success: true, key: s3Key, isMock: true };
  }

  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: s3Key
  });

  await client.send(command);
  return { success: true, key: s3Key, isMock: false };
}
