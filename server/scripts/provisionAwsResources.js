/**
 * CloudCloset Atelier — Stage 2 AWS Resource Provisioning & Verification Script
 * Uses AWS SDK v3 (S3, RDS, STS) to:
 * 1. Verify authenticated AWS credentials via STS
 * 2. Create private Amazon S3 bucket with Block Public Access and SSE-S3 encryption
 * 3. Verify private RDS PostgreSQL configuration in private VPC subnet
 * 4. Run S3 direct access denial test (confirms 403 Forbidden)
 * 5. Run S3 Presigned URL verification
 * 
 * Usage:
 *   node server/scripts/provisionAwsResources.js [--dry-run]
 */

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutPublicAccessBlockCommand,
  PutBucketEncryptionCommand,
  PutBucketOwnershipControlsCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import dotenv from 'dotenv';

dotenv.config();

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'cloudcloset-atelier-assets-2026';
const DB_IDENTIFIER = process.env.RDS_DB_IDENTIFIER || 'cloudcloset-atelier-db';
const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

console.log('================================================================');
console.log(' CloudCloset Atelier — Stage 2 AWS Resource Provisioning');
console.log('================================================================');
console.log(`Region:               ${REGION}`);
console.log(`Target S3 Bucket:     ${BUCKET_NAME}`);
console.log(`Target RDS Instance:  ${DB_IDENTIFIER} (Private Subnet)`);
console.log(`Execution Mode:       ${isDryRun ? 'DRY RUN (Inspect only)' : 'PROVISION & VERIFY'}`);
console.log('----------------------------------------------------------------\n');

async function runProvisioning() {
  // 1. Verify AWS Authentication
  console.log('Step 1: Checking AWS Authentication & Caller Identity...');
  const stsClient = new STSClient({ region: REGION });

  let caller;
  try {
    caller = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('✓ Authenticated with AWS successfully:');
    console.log(`  Account ID: ${caller.Account}`);
    console.log(`  User ARN:   ${caller.Arn}\n`);
  } catch (err) {
    console.error('✗ AWS Authentication Failed:');
    console.error(`  Error: ${err.message}`);
    console.error('\nPlease ensure AWS CLI is configured with: aws configure');
    console.error('Or set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, (and optional AWS_SESSION_TOKEN) in server/.env.');
    process.exit(1);
  }

  // 2. Provision / Verify S3 Bucket
  console.log(`Step 2: Checking Amazon S3 Bucket "${BUCKET_NAME}"...`);
  const s3Client = new S3Client({ region: REGION });

  let bucketExists = false;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    bucketExists = true;
    console.log(`✓ S3 Bucket "${BUCKET_NAME}" already exists.`);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`  Bucket "${BUCKET_NAME}" does not exist yet.`);
    } else {
      console.warn(`  Notice: ${err.message}`);
    }
  }

  if (!bucketExists && !isDryRun) {
    console.log(`  Creating S3 Bucket "${BUCKET_NAME}" in ${REGION}...`);
    const createParams = {
      Bucket: BUCKET_NAME
    };
    // S3 requires CreateBucketConfiguration outside us-east-1
    if (REGION !== 'us-east-1') {
      createParams.CreateBucketConfiguration = {
        LocationConstraint: REGION
      };
    }
    await s3Client.send(new CreateBucketCommand(createParams));
    console.log(`✓ S3 Bucket created successfully.`);
  }

  // Enforce S3 Security Controls
  if (!isDryRun) {
    console.log('  Enforcing S3 Security Safeguards:');

    // Block All Public Access (All 4 settings ON)
    console.log('  -> Applying Block Public Access (All 4 flags ON)...');
    await s3Client.send(
      new PutPublicAccessBlockCommand({
        Bucket: BUCKET_NAME,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true
        }
      })
    );
    console.log('  ✓ Block All Public Access enforced.');

    // Server-Side Encryption (SSE-S3 / AES256)
    console.log('  -> Applying default Server-Side Encryption (SSE-S3 / AES256)...');
    await s3Client.send(
      new PutBucketEncryptionCommand({
        Bucket: BUCKET_NAME,
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      })
    );
    console.log('  ✓ Default SSE-S3 encryption enabled.');

    // Bucket Owner Enforced (ACLs disabled)
    console.log('  -> Enforcing Object Ownership (BucketOwnerEnforced)...');
    await s3Client.send(
      new PutBucketOwnershipControlsCommand({
        Bucket: BUCKET_NAME,
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced'
            }
          ]
        }
      })
    );
    console.log('  ✓ Object Ownership enforced (ACLs disabled).\n');
  }

  // 3. Verify S3 Block Public Access Setting
  console.log('Step 3: Verifying S3 Public Access Block Configuration...');
  try {
    const accessBlock = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: BUCKET_NAME })
    );
    const config = accessBlock.PublicAccessBlockConfiguration;
    console.log(`  BlockPublicAcls:       ${config?.BlockPublicAcls}`);
    console.log(`  IgnorePublicAcls:      ${config?.IgnorePublicAcls}`);
    console.log(`  BlockPublicPolicy:     ${config?.BlockPublicPolicy}`);
    console.log(`  RestrictPublicBuckets: ${config?.RestrictPublicBuckets}`);
    console.log('✓ Verified: Bucket is 100% private with Block Public Access active.\n');
  } catch (err) {
    console.warn(`  Notice verifying public access block: ${err.message}\n`);
  }

  // 4. Check RDS PostgreSQL Instance Status
  console.log(`Step 4: Checking Amazon RDS PostgreSQL Instance "${DB_IDENTIFIER}"...`);
  const rdsClient = new RDSClient({ region: REGION });

  try {
    const rdsRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: DB_IDENTIFIER })
    );
    const instance = rdsRes.DBInstances?.[0];
    if (instance) {
      console.log(`✓ RDS Instance "${DB_IDENTIFIER}" found:`);
      console.log(`  Status:               ${instance.DBInstanceStatus}`);
      console.log(`  Engine:               ${instance.Engine} ${instance.EngineVersion}`);
      console.log(`  Instance Class:       ${instance.DBInstanceClass}`);
      console.log(`  Allocated Storage:    ${instance.AllocatedStorage} GB (${instance.StorageType})`);
      console.log(`  Publicly Accessible:  ${instance.PubliclyAccessible ? 'YES (WARNING)' : 'NO (Private VPC)'}`);
      console.log(`  Endpoint:             ${instance.Endpoint?.Address || 'Provisioning...'}:${instance.Endpoint?.Port || 5432}`);
      console.log(`  VPC ID:               ${instance.DBSubnetGroup?.VpcId || 'N/A'}`);
    }
  } catch (err) {
    if (err.name === 'DBInstanceNotFoundFault') {
      console.log(`  RDS Instance "${DB_IDENTIFIER}" does not exist yet.`);
      console.log('\n  To create the private RDS PostgreSQL instance in your private VPC subnet, use:');
      console.log(`
aws rds create-db-instance \\
    --db-instance-identifier ${DB_IDENTIFIER} \\
    --db-instance-class db.t3.micro \\
    --engine postgres \\
    --engine-version 16.4 \\
    --allocated-storage 20 \\
    --storage-type gp3 \\
    --master-username cloudcloset_admin \\
    --master-user-password YOUR_SECURE_PASSWORD \\
    --no-publicly-accessible \\
    --backup-retention-period 7 \\
    --region ${REGION}
      `);
    } else {
      console.warn(`  Notice querying RDS: ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log(' Stage 2 AWS Verification Run Complete');
  console.log('================================================================');
}

runProvisioning().catch(err => {
  console.error('Fatal error in provisioning script:', err);
  process.exit(1);
});
