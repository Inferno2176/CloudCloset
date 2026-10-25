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

// In-memory cache for presigned URLs with TTL to eliminate redundant HMAC recomputations
const presignedUrlCache = new Map();

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
    // Otherwise, AWS SDK v3 automatically relies on the EC2 IAM Instance Profile via IMDSv2.

    s3ClientInstance = new S3Client(config);
  }
  return s3ClientInstance;
}

export function resetS3Client() {
  s3ClientInstance = null;
  presignedUrlCache.clear();
}

export function getBucketName() {
  return process.env.AWS_S3_BUCKET_NAME || BUCKET_NAME;
}

export function getRegion() {
  return process.env.AWS_REGION || REGION;
}

// In-memory mock store for local development/testing when explicitly requested or during offline testing
const localMockS3Store = new Map();

export function getMockS3Store() {
  return localMockS3Store;
}

/**
 * Determines whether the S3 service should fall back to the in-memory mock store.
 * - In test environment (vitest) without real AWS credentials, uses mock store.
 * - If USE_MOCK_S3=true is explicitly set in environment, uses mock store.
 * - In production and development on EC2, attempts real S3 operations via IAM instance profile.
 */
export function shouldMockS3() {
  if (process.env.USE_MOCK_S3 === 'true') {
    return true;
  }
  if (process.env.NODE_ENV === 'test' && !process.env.AWS_ACCESS_KEY_ID && !process.env.FORCE_REAL_S3) {
    return true;
  }
  return false;
}

/**
 * Checks whether an object exists in the S3 bucket using HeadObjectCommand.
 * Prevents unintended overwrites of existing archival imagery.
 */
export async function checkObjectExists(s3Key) {
  if (!s3Key) return false;

  if (shouldMockS3()) {
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
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404 || err.name === 'NoSuchKey') {
      return false;
    }
    // If S3 returns 403 Forbidden because s3:ListBucket is missing on the bucket,
    // HeadObject cannot distinguish missing key from forbidden. Treat as non-existent.
    if (err.$metadata?.httpStatusCode === 403 || err.name === 'Forbidden') {
      console.warn(`[S3 Warning] HeadObject returned 403 Forbidden for "${s3Key}". Treating as non-existent.`);
      return false;
    }
    // Re-throw unexpected AWS/network errors for caller to handle
    throw err;
  }
}

/**
 * Uploads a validated product photograph to the private Amazon S3 bucket.
 * Bucket has Block Public Access enabled; images are stored securely with SSE-S3 AES-256 encryption.
 * Automatically generates a browser-accessible presigned GET URL upon successful upload.
 */
export async function uploadProductImage(fileBuffer, s3Key, mimeType, options = {}) {
  if (shouldMockS3()) {
    localMockS3Store.set(s3Key, {
      buffer: fileBuffer,
      mimeType,
      uploadedAt: new Date()
    });
    return {
      bucket: getBucketName(),
      key: s3Key,
      url: `/mock-s3/${s3Key}`,
      presignedUrl: `/mock-s3/${s3Key}`,
      isMock: true
    };
  }

  // Prevent accidental overwrite if requested
  if (options.preventOverwrite) {
    const alreadyExists = await checkObjectExists(s3Key);
    if (alreadyExists) {
      const err = new Error(`Object with key "${s3Key}" already exists in bucket "${getBucketName()}". Overwrite rejected.`);
      err.code = 'OBJECT_ALREADY_EXISTS';
      err.status = 409;
      throw err;
    }
  }

  try {
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
    console.log(`[S3 Upload Success] Uploaded object "${s3Key}" to bucket "${getBucketName()}"`);

    // Invalidate stale cache for this key
    presignedUrlCache.delete(s3Key);

    // Generate immediate browser-accessible presigned URL
    const presignedUrl = await getPresignedViewUrl(s3Key);

    return {
      bucket: getBucketName(),
      key: s3Key,
      url: presignedUrl || `s3://${getBucketName()}/${s3Key}`,
      presignedUrl: presignedUrl || `s3://${getBucketName()}/${s3Key}`,
      isMock: false
    };
  } catch (err) {
    console.error(`[S3 Upload Error] Failed uploading "${s3Key}" to bucket "${getBucketName()}":`, err.name, err.message);
    const customErr = new Error(`S3 upload failed: ${err.message}`);
    customErr.code = err.name || 'S3_UPLOAD_ERROR';
    customErr.status = 502; // Upstream Storage failure
    throw customErr;
  }
}

/**
 * Generates a short-lived presigned GET URL for secure client viewing from private S3.
 *
 * Expiration defaults to 3600 seconds (1 hour).
 * Caches generated URLs in-memory for 45 minutes to minimize cryptographic overhead.
 * Handles missing keys or unavailable objects gracefully by returning null.
 */
export async function getPresignedViewUrl(s3Key, expiresInSeconds = 3600) {
  if (!s3Key) return null;

  if (shouldMockS3()) {
    if (localMockS3Store.has(s3Key)) {
      return `/mock-s3/${s3Key}`;
    }
    return null;
  }

  const now = Date.now();
  const cached = presignedUrlCache.get(s3Key);
  if (cached && cached.expiresAt > now + 300000) {
    return cached.url;
  }

  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    presignedUrlCache.set(s3Key, {
      url: presignedUrl,
      expiresAt: now + expiresInSeconds * 1000
    });
    return presignedUrl;
  } catch (err) {
    console.warn(`[S3 Presign Warning] Could not generate presigned URL for key "${s3Key}":`, err.message);
    return null;
  }
}

/**
 * Deletes a product image from the Amazon S3 bucket.
 * Invalidates any cached presigned URLs for the key.
 */
export async function deleteProductImage(s3Key) {
  if (!s3Key) return { success: false, reason: 'missing_key' };

  presignedUrlCache.delete(s3Key);

  if (shouldMockS3()) {
    localMockS3Store.delete(s3Key);
    return { success: true, key: s3Key, isMock: true };
  }

  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key
    });

    await client.send(command);
    console.log(`[S3 Delete Success] Deleted object "${s3Key}" from bucket "${getBucketName()}"`);
    return { success: true, key: s3Key, isMock: false };
  } catch (err) {
    console.error(`[S3 Delete Error] Failed deleting "${s3Key}":`, err.message);
    throw err;
  }
}
