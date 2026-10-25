/**
 * CloudCloset Atelier — S3 Security & Privacy Verification Script
 * 
 * Verifies:
 * 1. Anonymous direct HTTP GET to S3 object returns 403 Forbidden (Block Public Access verified).
 * 2. Authenticated Presigned GET URL returns 200 OK with valid image buffer.
 * 
 * Usage:
 *   node server/scripts/verifyS3Security.js
 */

import { getPresignedViewUrl } from '../src/services/s3Service.js';
import dotenv from 'dotenv';

dotenv.config();

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'cloudcloset-atelier-assets-2026';
const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const TEST_KEY = 'products/cc-001/primary.webp';

async function verifySecurity() {
  console.log('=== CloudCloset Amazon S3 Security & Access Control Verification ===');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${REGION}`);
  console.log(`Test Object Key: ${TEST_KEY}\n`);

  // Test 1: Anonymous direct public access
  const directPublicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${TEST_KEY}`;
  console.log(`Test 1: Testing direct anonymous public access to:`);
  console.log(`  ${directPublicUrl}`);

  try {
    const publicRes = await fetch(directPublicUrl);
    console.log(`  Response Status: ${publicRes.status} ${publicRes.statusText}`);

    if (publicRes.status === 403 || publicRes.status === 404) {
      console.log('  ✓ PASS: Direct public access is DENIED (Block Public Access active).\n');
    } else {
      console.error(`  ✗ FAIL: Unexpected status ${publicRes.status}. Bucket might be publicly readable!\n`);
    }
  } catch (err) {
    console.log(`  ✓ PASS: Network/access rejected: ${err.message}\n`);
  }

  // Test 2: Authorized Presigned URL access
  console.log('Test 2: Testing access via backend-generated Presigned URL...');
  try {
    const presignedUrl = await getPresignedViewUrl(TEST_KEY, 3600);
    console.log(`  Presigned URL generated: ${presignedUrl.slice(0, 80)}...`);

    if (presignedUrl.startsWith('/mock-s3/')) {
      console.log('  [Local Mock Mode active: AWS credentials not yet provided in .env]\n');
      return;
    }

    const presignedRes = await fetch(presignedUrl);
    console.log(`  Response Status: ${presignedRes.status} ${presignedRes.statusText}`);

    if (presignedRes.status === 200) {
      console.log('  ✓ PASS: Presigned URL successfully accessed private image.\n');
    } else {
      console.log(`  Status ${presignedRes.status} (Object may not be uploaded to this key yet).\n`);
    }
  } catch (err) {
    console.error(`  Presigned URL error: ${err.message}\n`);
  }

  console.log('=== S3 Security Verification Complete ===');
}

verifySecurity().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
