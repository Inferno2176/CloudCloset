# CloudCloset — Amazon EC2 & RDS Production Deployment Guide

This guide provides the complete, production-grade instructions for deploying the CloudCloset atelier platform onto **Amazon EC2** with a private **Amazon RDS for PostgreSQL** database and private **Amazon S3** bucket in the Sydney region (`ap-southeast-2`).

---

## 1. High-Level Architecture Overview

```
                      INTERNET
                         │
                         ▼ (Ports 80 / 443)
              ┌─────────────────────┐
              │     Elastic IP      │
              └──────────┬──────────┘
                         │
        ┌────────────────▼────────────────┐
        │       Public Subnet (VPC)       │
        │  Amazon EC2 (t3.small)          │
        │  ┌───────────────────────────┐  │
        │  │ Nginx (Port 80/443 SSL)   │  │
        │  │  ├─ Static Files (/dist)  │  │
        │  │  └─ Proxy Pass /api/ ─────┼──┼──┐
        │  └───────────────────────────┘  │  │
        │  ┌───────────────────────────┐  │  │
        │  │ Express Node.js (Port 5001│◄─┘  │
        │  │ PM2 / Systemd Service     │     │
        │  │ (EC2 IAM Instance Profile)│     │
        │  └─────────────┬─────────────┘     │
        └────────────────┼────────────────┘  │
                         │                   │
                         │ (IAM Role)        │ (Port 5432 Private)
                         ▼                   ▼
    ┌─────────────────────────┐   ┌─────────────────────────┐
    │  Amazon S3 (Private)    │   │  Private Subnet (VPC)   │
    │  cloudcloset-atelier-   │   │  Amazon RDS PostgreSQL  │
    │  assets-2026            │   │  (Port 5432 NOT Public) │
    └─────────────────────────┘   └─────────────────────────┘
```

---

## 2. Least-Privilege EC2 IAM Role for S3 Access

To eliminate hardcoded AWS keys on the EC2 server, attach an **IAM Instance Profile** using AWS SDK v3's default credential provider chain.

### Step 2.1: Create IAM Policy Document
Save the following as `ec2-s3-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3AssetOperations",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cloudcloset-atelier-assets-2026/*"
    },
    {
      "Sid": "AllowS3BucketListing",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::cloudcloset-atelier-assets-2026"
    }
  ]
}
```

### Step 2.2: Create IAM Trust Policy for EC2
Save the following as `ec2-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Step 2.3: Create Role and Instance Profile via AWS CLI
```bash
# 1. Create IAM Role
aws iam create-role \
    --role-name CloudClosetEC2S3Role \
    --assume-role-policy-document file://ec2-trust-policy.json

# 2. Put Policy into Role
aws iam put-role-policy \
    --role-name CloudClosetEC2S3Role \
    --policy-name CloudClosetS3AccessPolicy \
    --policy-document file://ec2-s3-policy.json

# 3. Create Instance Profile
aws iam create-instance-profile \
    --instance-profile-name CloudClosetEC2InstanceProfile

# 4. Add Role to Instance Profile
aws iam add-role-to-instance-profile \
    --instance-profile-name CloudClosetEC2InstanceProfile \
    --role-name CloudClosetEC2S3Role
```

---

## 3. Network & Security Group Hardening

### 3.1: EC2 Web Security Group (`cloudcloset-ec2-sg`)
Create security group in your VPC:
```bash
# Create Security Group
aws ec2 create-security-group \
    --group-name cloudcloset-ec2-sg \
    --description "CloudCloset Web Server SG" \
    --vpc-id vpc-xxxxxxxxx \
    --region ap-southeast-2

# Allow Inbound HTTP (Port 80)
aws ec2 authorize-security-group-ingress \
    --group-name cloudcloset-ec2-sg \
    --protocol tcp --port 80 --cidr 0.0.0.0/0 \
    --region ap-southeast-2

# Allow Inbound HTTPS (Port 443)
aws ec2 authorize-security-group-ingress \
    --group-name cloudcloset-ec2-sg \
    --protocol tcp --port 443 --cidr 0.0.0.0/0 \
    --region ap-southeast-2

# Allow Inbound SSH (Port 22) from your IP ONLY
aws ec2 authorize-security-group-ingress \
    --group-name cloudcloset-ec2-sg \
    --protocol tcp --port 22 --cidr YOUR_MANAGEMENT_IP/32 \
    --region ap-southeast-2
```

### 3.2: Private RDS PostgreSQL Security Group (`cloudcloset-rds-sg`)
**CRITICAL:** Port 5432 MUST NEVER be exposed to `0.0.0.0/0`. Inbound access is restricted strictly to the EC2 security group ID.

```bash
# Create RDS Security Group
aws ec2 create-security-group \
    --group-name cloudcloset-rds-sg \
    --description "CloudCloset Private Database SG" \
    --vpc-id vpc-xxxxxxxxx \
    --region ap-southeast-2

# Allow Inbound PostgreSQL (Port 5432) ONLY from cloudcloset-ec2-sg
aws ec2 authorize-security-group-ingress \
    --group-name cloudcloset-rds-sg \
    --protocol tcp --port 5432 \
    --source-group sg-xxxxxxxxx_EC2_SG_ID \
    --region ap-southeast-2
```

---

## 4. Manual RDS PostgreSQL Database Provisioning

Create a multi-AZ or single-AZ PostgreSQL database in private VPC subnets:

```bash
aws rds create-db-instance \
    --db-instance-identifier cloudcloset-atelier-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 16.4 \
    --allocated-storage 20 \
    --storage-type gp3 \
    --master-username cloudcloset_admin \
    --master-user-password "USE_A_STRONG_RANDOM_PASSWORD_32_CHARS" \
    --vpc-security-group-ids sg-xxxxxxxxx_RDS_SG_ID \
    --db-subnet-group-name your-private-db-subnet-group \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --region ap-southeast-2
```

---

## 5. Manual EC2 Instance Launch

```bash
aws ec2 run-instances \
    --image-id ami-xxxxxxxxx \
    --instance-type t3.small \
    --key-name your-ec2-keypair \
    --security-group-ids sg-xxxxxxxxx_EC2_SG_ID \
    --subnet-id subnet-xxxxxxxxx_PUBLIC_SUBNET \
    --iam-instance-profile Name=CloudClosetEC2InstanceProfile \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=CloudCloset-Atelier-Server}]' \
    --region ap-southeast-2
```

---

## 6. Server Initialization & Application Deployment

Connect to the EC2 instance via SSH:
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_ELASTIC_IP
```

### 6.1: Install Node.js 20 & Nginx
```bash
# Amazon Linux 2023:
sudo dnf update -y
sudo dnf install -y nodejs npm nginx git certbot python3-certbot-nginx

# Ubuntu 22.04/24.04:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx
```

### 6.2: Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-org/CloudCloset.git /home/ec2-user/CloudCloset
cd /home/ec2-user/CloudCloset

# Install production dependencies
npm ci
cd server && npm ci --omit=dev && cd ..

# Build frontend production bundle into dist/
npm run build
```

### 6.3: Secure Environment Configuration
Create `/home/ec2-user/CloudCloset/server/.env` with strict permissions:

```bash
cat << 'EOF' > /home/ec2-user/CloudCloset/server/.env
PORT=5001
NODE_ENV=production
CLIENT_URL=https://your-domain.com

# RDS PostgreSQL Connection
DATABASE_URL=postgresql://cloudcloset_admin:YOUR_DB_PASSWORD@cloudcloset-atelier-db.xxxxxx.ap-southeast-2.rds.amazonaws.com:5432/cloudcloset
DB_HOST=cloudcloset-atelier-db.xxxxxx.ap-southeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=cloudcloset
DB_USER=cloudcloset_admin
DB_PASSWORD=YOUR_DB_PASSWORD
DB_SSL=true

# Authentication Secrets
JWT_SECRET=USE_A_CRYPTOGRAPHICALLY_SECURE_64_CHAR_HEX_STRING
JWT_EXPIRES_IN=7d

# S3 Configuration (Sydney Region — No keys needed, uses EC2 Instance Profile)
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=cloudcloset-atelier-assets-2026
EOF

# Restrict permissions so only the owner can read:
chmod 600 /home/ec2-user/CloudCloset/server/.env
```

### 6.4: Run Database Migrations & Verification
```bash
cd /home/ec2-user/CloudCloset/server
npm run migrate
npm run seed
npm run db:verify
```

---

## 7. Service Startup (PM2 or Systemd)

### Option A: PM2 (Recommended for Node.js clustering & logs)
```bash
sudo npm install -g pm2
cd /home/ec2-user/CloudCloset
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### Option B: Systemd Unit
```bash
sudo cp /home/ec2-user/CloudCloset/deploy/cloudcloset.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cloudcloset
sudo systemctl status cloudcloset
```

---

## 8. Nginx Reverse Proxy & HTTPS Setup

### 8.1: Configure Nginx
```bash
sudo cp /home/ec2-user/CloudCloset/deploy/nginx.conf /etc/nginx/conf.d/cloudcloset.conf
# Update server_name with your actual domain in /etc/nginx/conf.d/cloudcloset.conf
sudo nginx -t
sudo systemctl restart nginx
```

### 8.2: Obtain Free Let's Encrypt TLS Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 9. Verification & Health Monitoring

Test the deployed application from external terminal:
```bash
# Verify API & Database Health
curl -s https://your-domain.com/api/health | jq .

# Output:
# {
#   "status": "healthy",
#   "database": "connected",
#   "service": "CloudCloset Atelier API Server",
#   "environment": "production"
# }

# Verify Database Latency
curl -s https://your-domain.com/api/health/db | jq .

# Verify S3 Presigned URL Delivery
curl -s https://your-domain.com/api/products/cc-001/presigned-url | jq .
```
