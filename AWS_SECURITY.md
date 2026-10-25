# CloudCloset — AWS Security & Production Architecture Specification

This document details the security principles, IAM access policies, credential hygiene, network isolation, and data-protection controls designed for CloudCloset.

---

## 1. AWS Deployment & Security Blueprint (Level 1 & Level 2 Readiness)

```
                            [ CloudFront / ACM (HTTPS 443) ]
                                          │
                                          ▼
                         [ Public Subnets (VPC 10.0.0.0/16) ]
                         ┌──────────────────────────────────┐
                         │   Application Load Balancer      │
                         │   Security Group: sg-alb         │
                         │   Inbound: 80, 443 (Internet)    │
                         └─────────────────┬────────────────┘
                                           │
                                           ▼ (Port 5001)
                        [ Private App Subnets (No Public IP) ]
                        ┌───────────────────────────────────┐
                        │   EC2 Instances / Node.js Server  │
                        │   Security Group: sg-cloudcloset-app│
                        │   Inbound: Port 5001 from sg-alb   │
                        │   IAM Role: CloudClosetEC2Role    │
                        └──────────────────┬────────────────┘
                                           │
                                           ▼ (Port 5432 with TLS)
                        [ Private DB Subnets (Isolated VPC) ]
                        ┌───────────────────────────────────┐
                        │   Amazon RDS PostgreSQL 16        │
                        │   Security Group: sg-cloudcloset-db│
                        │   Inbound: 5432 only from sg-app  │
                        │   Public Access: NO               │
                        └───────────────────────────────────┘
```

---

## 2. IAM Least-Privilege Policy for EC2 Application Instance

The EC2 instance hosting the CloudCloset backend must **never use hardcoded IAM Access Keys**. Instead, an **IAM Instance Profile (`CloudClosetEC2Role`)** is attached to the instance.

### Instance Profile Policies:

1. **Amazon S3 Product Imagery Operations (`CloudClosetS3AccessPolicy`)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowProductImageOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cloudcloset-atelier-assets-2026/*"
    },
    {
      "Sid": "AllowBucketListingForVerification",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::cloudcloset-atelier-assets-2026"
    }
  ]
}
```

2. **AWS Systems Manager / Secrets Manager Retrieval (`CloudClosetSecretsPolicy`)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSecretsRetrieval",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:secretsmanager:ap-southeast-2:*:secret:cloudcloset/*",
        "arn:aws:kms:ap-southeast-2:*:key/*"
      ]
    }
  ]
}
```

3. **AWS Systems Manager Core (`AmazonSSMManagedInstanceCore`)**:
Enables secure terminal access via AWS Systems Manager Session Manager without opening inbound SSH port 22.

---

## 3. Network Security Groups & Port Rules

Strict ingress/egress boundaries are enforced using Security Group chaining:

### A. Application Load Balancer Security Group (`sg-cloudcloset-alb`)
| Direction | Type | Port | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Inbound** | HTTPS | 443 | `0.0.0.0/0` | Encrypted public client traffic |
| **Inbound** | HTTP | 80 | `0.0.0.0/0` | Redirects HTTP to HTTPS 443 |
| **Outbound** | Custom TCP | 5001 | `sg-cloudcloset-app` | Forward traffic to backend Express app |

### B. EC2 Application Security Group (`sg-cloudcloset-app`)
| Direction | Type | Port | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Inbound** | Custom TCP | 5001 | `sg-cloudcloset-alb` | Only ALB can communicate with Express backend |
| **Outbound** | PostgreSQL | 5432 | `sg-cloudcloset-db` | Dedicated outbound egress to Amazon RDS |
| **Outbound** | HTTPS | 443 | `0.0.0.0/0` | S3 API, AWS KMS, and npm registry access |

### C. Amazon RDS Database Security Group (`sg-cloudcloset-db`)
| Direction | Type | Port | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Inbound** | PostgreSQL | 5432 | `sg-cloudcloset-app` | **Strict ingress: Only EC2 instances in sg-app can connect** |
| **Outbound** | None | - | - | Private database instances have zero outbound internet routing |

> [!CRITICAL]
> **Zero Public PostgreSQL Access on Port 5432:**
> Under no circumstances is port 5432 open to `0.0.0.0/0`. The RDS instance has `PubliclyAccessible: No` and is housed within isolated private DB subnets across 2 Availability Zones.

---

## 4. Database Security & Amazon RDS TLS Encryption

### A. Validated TLS Certificate Verification
When connecting to Amazon RDS, the backend enforces encrypted in-transit traffic using the **Amazon RDS Global Trust Store CA certificate (`server/src/config/rds-ca-bundle.pem`)**.
- `rejectUnauthorized: true` is strictly enforced.
- Disabling certificate verification (`rejectUnauthorized: false`) is disallowed in production.

### B. Password Hashing (bcrypt)
- Passwords are salted and hashed using **bcrypt** with work factor 10.
- Raw passwords are never logged, returned in query responses, or stored in plaintext.
- Hashes are one-way and irreversible.

---

## 5. Application Secrets Management

Production credentials (`DATABASE_URL`, `JWT_SECRET`, database passwords) must **never be checked into Git**:
1. In development, credentials reside in `.env` (ignored by `.gitignore`).
2. `.env.example` provides safe placeholders only.
3. In production EC2 deployments, environment variables are populated dynamically at container/service startup from **AWS Secrets Manager** or **AWS Systems Manager Parameter Store** via IAM Instance Profile.

---

## 6. HTTPS & Transport Security

- Production domains enforce HTTPS (TLS 1.2 / TLS 1.3).
- HTTP Strict Transport Security (`HSTS`) is enabled via Helmet.
- Clickjacking protection (`X-Frame-Options: DENY`) and MIME-type sniffing prevention (`X-Content-Type-Options: nosniff`) are configured.
