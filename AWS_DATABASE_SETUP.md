# CloudCloset — Amazon RDS for PostgreSQL Database Guide

This guide details how to provision, configure, migrate, and maintain the Amazon RDS PostgreSQL database for CloudCloset.

---

## 1. Amazon RDS Instance Specifications

| Setting | Recommended Value | Free Tier Eligibility |
| :--- | :--- | :--- |
| **Engine** | PostgreSQL 16.x | Eligible |
| **Template** | **Free tier** | Ensures only free-tier configurations are selected |
| **DB Instance Identifier** | `cloudcloset-atelier-db` | - |
| **Master Username** | `cloudcloset_admin` | - |
| **Master Password** | Strong generated password (16+ chars) | - |
| **Instance Class** | `db.t3.micro` or `db.t4g.micro` (2 vCPU, 1 GB RAM) | 750 hours/month Free Tier |
| **Storage Type** | General Purpose SSD (gp3 or gp2) | 20 GB included in Free Tier |
| **Allocated Storage** | 20 GiB | Included |
| **Storage Autoscaling** | Disabled (to prevent accidental billable scaling) | - |
| **Multi-AZ Deployment** | **No** (Single-AZ for college demo) | Multi-AZ is billable |
| **Public Access** | **No** (Private) or restricted to developer IP `/32` | - |
| **Backup Retention** | 7 days automated backups | Included |

---

## 2. Step-by-Step Creation via AWS Console

1. Navigate to the **Amazon RDS Console** (`https://console.aws.amazon.com/rds/`).
2. Click **Create database**.
3. Choose a database creation method: **Standard create**.
4. Engine options:
   * Engine type: **PostgreSQL**.
   * Version: **PostgreSQL 16.x** (latest minor).
5. Templates: Select **Free tier**.
6. Settings:
   * DB instance identifier: `cloudcloset-atelier-db`.
   * Master username: `cloudcloset_admin`.
   * Master password: Set a secure password and record it safely.
7. Instance configuration:
   * DB instance class: `db.t3.micro` or `db.t4g.micro`.
8. Storage:
   * Storage type: General Purpose SSD (gp3).
   * Allocated storage: `20` GiB.
   * **Uncheck** "Enable storage autoscaling".
9. Connectivity:
   * Virtual private cloud (VPC): Default VPC.
   * Public access:
     * *For pure cloud deployment:* Select **No**.
     * *For local development directly to RDS:* Select **Yes** and strictly configure the Security Group (see Section 3).
10. Database authentication: Password authentication.
11. Additional configuration:
    * Initial database name: `cloudcloset`.
    * Backup retention period: `7 days`.
12. Click **Create database** (takes 5-10 minutes to provision).

---

## 3. Network Architecture: Private VPC Subnet & VPN / SSM Tunnel

In accordance with strict security standards, the Amazon RDS PostgreSQL instance is deployed with **Zero Public Internet Routing**:

* **Publicly Accessible:** `No`
* **Subnet Group:** Private DB Subnet Group spanning 2 Availability Zones within your VPC (e.g. `subnet-private-1a`, `subnet-private-1b`).
* **Route Tables:** Associated private route tables have **no route to an Internet Gateway (`0.0.0.0/0 -> igw-xxx`)**.

### Local Workstation Connection via VPN / SSM Port Forwarding

To connect your local Express backend (`localhost:5000`) to the private RDS instance securely without exposing port 5432 to the internet:

1. **Option 1: AWS Client VPN / WireGuard**
   Connect your workstation to the VPC Client VPN endpoint. Your local machine receives a private IP within the VPC (e.g. `10.0.x.x`) and resolves the private RDS DNS endpoint directly.

2. **Option 2: AWS Systems Manager (SSM) Session Manager Port Forwarding**
   If an authorized private EC2 management bastion exists in the VPC, forward port 5432 through an encrypted SSM WebSocket session:
   ```bash
   aws ssm start-session \
       --target i-0123456789abcdef0 \
       --document-name AWS-StartPortForwardingSessionToRemoteHost \
       --parameters '{"host":["cloudcloset-atelier-db.c123456789.ap-south-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5432"]}'
   ```
   Then set `DATABASE_URL=postgresql://cloudcloset_admin:YOUR_PASSWORD@localhost:5432/cloudcloset` in `server/.env`.

---

## 4. Running Migrations & Seeding Data

Once the RDS instance status displays **Available**:

1. Note the **Endpoint** from the RDS console (e.g. `cloudcloset-atelier-db.c123456789.ap-south-1.rds.amazonaws.com`).
2. Configure `server/.env`:
   ```env
   DATABASE_URL=postgresql://cloudcloset_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/cloudcloset?sslmode=require
   DB_SSL=true
   ```
3. Run migrations to initialize all 8 tables and indices:
   ```bash
   cd server
   npm run migrate
   ```
4. Run the idempotent seed script to populate the 60 archival garments, default administrator, and customer account:
   ```bash
   npm run seed
   ```

---

## 5. Cost Considerations: Stopping vs. Terminating RDS

* **Stopping an RDS Instance:**
  You can temporarily stop an RDS instance from the console for up to 7 days.
  * Compute charges pause while stopped.
  * **However:** Storage charges (~$0.115/GB-month = ~$2.30/month for 20 GB) continue to accrue even while stopped.
* **Terminating (Deleting) RDS:**
  When your academic evaluation is complete:
  1. Open the RDS Console.
  2. Select `cloudcloset-atelier-db` → **Actions** → **Delete**.
  3. Deselect "Create final snapshot" (or take one if you wish to retain a backup).
  4. Confirm deletion. This immediately halts all ongoing billing.
