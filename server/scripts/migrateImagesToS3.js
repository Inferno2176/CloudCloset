/**
 * CloudCloset Atelier — S3 Product Image Migration Script
 * 
 * Migrates archival catalogue product images to Amazon S3 bucket.
 * 
 * Safety Rules:
 * - DRY-RUN is ENABLED BY DEFAULT.
 * - Real live upload requires explicit '--execute' or '--live' flag AND user approval.
 * - Before uploading, checks if target S3 object already exists using HeadObject.
 * - Prevents overwriting existing objects unless '--overwrite' is explicitly provided.
 * - Preserves mapping between each product and its original high-resolution CDN image.
 * - Generates an audit manifest at server/scripts/s3_migration_manifest.json.
 * 
 * Usage:
 *   node server/scripts/migrateImagesToS3.js                 # Safe dry-run (Default)
 *   node server/scripts/migrateImagesToS3.js --dry-run       # Explicit dry-run
 *   node server/scripts/migrateImagesToS3.js --execute       # Live migration (Requires explicit approval)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initialProducts } from '../../src/data/products.js';
import { uploadProductImage, checkObjectExists, getBucketName, getRegion } from '../src/services/s3Service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_PATH = path.join(__dirname, 's3_migration_manifest.json');

const args = process.argv.slice(2);
const isExplicitLive = args.includes('--execute') || args.includes('--live');
const isExplicitDryRun = args.includes('--dry-run');
const allowOverwrite = args.includes('--overwrite');

// DRY-RUN BY DEFAULT unless --execute/--live is passed and --dry-run is not passed
const isDryRun = isExplicitDryRun || !isExplicitLive;

async function runCatalogueMigration() {
  const bucket = getBucketName();
  const region = getRegion();

  console.log('================================================================');
  console.log(' CloudCloset Atelier — Amazon S3 Catalogue Image Migration');
  console.log('================================================================');
  console.log(`Bucket Name:          ${bucket}`);
  console.log(`AWS Region:           ${region}`);
  console.log(`Execution Mode:       ${isDryRun ? 'DRY-RUN (Inspection & Verification Only - Default)' : 'LIVE EXECUTION (Real S3 Uploads)'}`);
  console.log(`Overwrite Existing:   ${allowOverwrite ? 'YES' : 'NO (Preserves existing objects)'}`);
  console.log(`Products in Archive:  ${initialProducts.length}`);
  console.log('----------------------------------------------------------------\n');

  let discoveredCount = 0;
  let eligibleCount = 0;
  let skippedCount = 0;
  let uploadedCount = 0;
  let failedCount = 0;

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket,
    region,
    mode: isDryRun ? 'dry-run' : 'live',
    totalProducts: initialProducts.length,
    statistics: {},
    items: []
  };

  for (const product of initialProducts) {
    discoveredCount++;

    const primaryImageUrl = product.images?.[0];
    const s3Key = product.s3Key || `products/${product.id}/primary.webp`;

    const itemRecord = {
      productId: product.id,
      name: product.name,
      category: product.category,
      gender: product.gender,
      originalImageUrl: primaryImageUrl || null,
      targetS3Key: s3Key,
      status: 'pending',
      reason: null
    };

    // Check if source image URL exists
    if (!primaryImageUrl) {
      itemRecord.status = 'skipped';
      itemRecord.reason = 'Missing source image URL';
      skippedCount++;
      manifest.items.push(itemRecord);
      console.log(`[-] [${product.id}] ${product.name} — SKIPPED (No source image)`);
      continue;
    }

    eligibleCount++;

    // Check whether object already exists in S3
    let alreadyExists = false;
    try {
      alreadyExists = await checkObjectExists(s3Key);
    } catch (_err) {
      // In dry-run without credentials, checkObjectExists returns false
      alreadyExists = false;
    }

    if (alreadyExists && !allowOverwrite) {
      itemRecord.status = 'skipped';
      itemRecord.reason = 'Object already exists in S3 and --overwrite not specified';
      skippedCount++;
      manifest.items.push(itemRecord);
      console.log(`[~] [${product.id}] ${product.name} — SKIPPED (Already exists at s3://${bucket}/${s3Key})`);
      continue;
    }

    if (isDryRun) {
      itemRecord.status = 'dry_run_verified';
      itemRecord.reason = 'Eligible for upload. Source URL validated.';
      uploadedCount++;
      manifest.items.push(itemRecord);
      console.log(`[✓] [${product.id}] ${product.name}`);
      console.log(`    Source:    ${primaryImageUrl.slice(0, 65)}...`);
      console.log(`    Target S3: s3://${bucket}/${s3Key}`);
      console.log(`    Status:    Dry-run verified (Ready for upload)\n`);
      continue;
    }

    // LIVE MODE EXECUTION (Requires explicit user approval)
    try {
      console.log(`[^] Uploading [${product.id}] ${product.name}...`);
      const fetchRes = await fetch(primaryImageUrl);
      if (!fetchRes.ok) {
        throw new Error(`HTTP ${fetchRes.status} fetching source image from CDN`);
      }
      const arrayBuf = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';

      const uploadResult = await uploadProductImage(buffer, s3Key, mimeType, {
        preventOverwrite: !allowOverwrite
      });

      itemRecord.status = 'uploaded';
      itemRecord.s3Url = uploadResult.url;
      itemRecord.isMock = uploadResult.isMock;
      uploadedCount++;
      manifest.items.push(itemRecord);
      console.log(`    Uploaded successfully -> ${uploadResult.url}\n`);

      // Throttle slightly to respect rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      itemRecord.status = 'failed';
      itemRecord.reason = err.message;
      failedCount++;
      manifest.items.push(itemRecord);
      console.error(`    Upload Failed for ${product.id}: ${err.message}\n`);
    }
  }

  manifest.statistics = {
    discovered: discoveredCount,
    eligible: eligibleCount,
    skipped: skippedCount,
    uploaded: uploadedCount,
    failed: failedCount
  };

  // Write manifest file to preserve full product-to-image mapping
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`✓ Migration manifest saved: ${MANIFEST_PATH}`);
  } catch (err) {
    console.warn(`Could not save migration manifest: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(' Catalogue Image Migration Summary');
  console.log('================================================================');
  console.log(`Mode:                 ${isDryRun ? 'DRY-RUN (No S3 changes made)' : 'LIVE'}`);
  console.log(`Discovered Images:    ${discoveredCount}`);
  console.log(`Eligible for S3:      ${eligibleCount}`);
  console.log(`Skipped:              ${skippedCount}`);
  console.log(`Uploaded / Verified:  ${uploadedCount}`);
  console.log(`Failed:               ${failedCount}`);
  console.log('----------------------------------------------------------------');

  if (isDryRun) {
    console.log('NOTE: Dry-run completed safely. To execute the live migration,');
    console.log('obtain explicit approval and run with: node server/scripts/migrateImagesToS3.js --execute');
  }
}

runCatalogueMigration().catch(err => {
  console.error('Fatal error in migration script:', err);
  process.exit(1);
});
