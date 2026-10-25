# CloudCloset — Amazon S3 Product Image Storage Guide

This document describes the configuration, security controls, and operational workflows for Amazon S3 persistent product image storage for the CloudCloset atelier platform.

---

## 1. Bucket Specifications & Security Settings

| Setting | Production Target Value | Reason |
| :--- | :--- | :--- |
| **Bucket Name** | `cloudcloset-atelier-assets-2026` | Dedicated S3 bucket for atelier assets. |
| **AWS Region** | `ap-southeast-2` (Sydney) | Production AWS region. |
| **Block Public Access** | **Enabled (All 4 settings ON)** | Prevents accidental public exposure of storage objects. |
| **Object Ownership** | **Bucket owner enforced (ACLs disabled)** | Modern AWS security standard. |
| **Default Encryption** | **SSE-S3 (AES-256)** | Automatic server-side encryption at rest. |
| **Credential Provider** | **AWS SDK v3 Default Credential Chain** | Seamless IAM Instance Profile on EC2 without static keys. |

---

## 2. Manual Bucket Creation (Exact AWS CLI Commands)

To create the bucket manually using the AWS CLI in `ap-southeast-2`:

```bash
# 1. Create S3 Bucket with LocationConstraint
aws s3api create-bucket \
    --bucket cloudcloset-atelier-assets-2026 \
    --region ap-southeast-2 \
    --create-bucket-configuration LocationConstraint=ap-southeast-2

# 2. Enforce Block Public Access (All 4 flags ON)
aws s3api put-public-access-block \
    --bucket cloudcloset-atelier-assets-2026 \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --region ap-southeast-2

# 3. Enable Default AES-256 Encryption
aws s3api put-bucket-encryption \
    --bucket cloudcloset-atelier-assets-2026 \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' \
    --region ap-southeast-2

# 4. Enforce Bucket Owner Object Ownership (Disable ACLs)
aws s3api put-bucket-ownership-controls \
    --bucket cloudcloset-atelier-assets-2026 \
    --ownership-controls '{
        "Rules": [{
            "ObjectOwnership": "BucketOwnerEnforced"
        }]
    }' \
    --region ap-southeast-2
```

---

## 3. Product Image Hierarchy & Object Key Architecture

Images are structured with a clean, predictable key hierarchy:

```
cloudcloset-atelier-assets-2026/
└── products/
    ├── cc-001/
    │   ├── primary.webp
    │   └── gallery-1.webp
    ├── cc-002/
    │   ├── primary.webp
    │   └── gallery-1.webp
    └── ...
```

* **Primary Campaign Image:** `products/{productId}/primary.{ext}`
* **Gallery Looks:** `products/{productId}/gallery-{index}.{ext}`
* **Supported Formats:** `.webp`, `.jpg`, `.jpeg`, `.png`
* **File Size Constraint:** Up to 5 MB per photograph.

---

## 4. Secure Image Delivery: Presigned URLs & CDN Fallback

Because the S3 bucket is **100% private with Block Public Access active**, client browsers cannot load images directly via static S3 URLs without authorization (which returns `403 Forbidden`).

### Presigned URL Architecture
The backend Express service generates short-lived signed URLs using `@aws-sdk/s3-request-presigner`:
* **Endpoint:** `GET /api/products/:id/presigned-url`
* **Expiration:** 3600 seconds (1 hour).
* **Missing Object / S3 Error Handling:** Returns `null` presigned URL safely and falls back cleanly to the external Unsplash CDN URL.
* **Inline SVG Fallback:** If both S3 and CDN are unreachable, frontend falls back to `FALLBACK_PRODUCT_IMAGE` inline SVG (guaranteed 0% broken-image rate).

---

## 5. Catalogue Migration Workflow

The migration script safely reads all 60 products from `src/data/products.js`:

```bash
# Safe Dry-Run (Default - No S3 uploads or charges)
node server/scripts/migrateImagesToS3.js

# Explicit Dry-Run
npm run s3:migrate

# Live Migration (Only after explicit approval and bucket creation)
node server/scripts/migrateImagesToS3.js --execute
```

### Safety Features
1. **Dry-Run by Default:** Real uploads will never occur unless `--execute` is explicitly supplied.
2. **Duplicate Prevention:** Calls `HeadObjectCommand` via `checkObjectExists(s3Key)` before uploading.
3. **Overwrite Protection:** Does not overwrite existing S3 objects unless `--overwrite` is specified.
4. **Audit Manifest:** Generates and maintains `server/scripts/s3_migration_manifest.json` preserving the original CDN image URL for each product.
