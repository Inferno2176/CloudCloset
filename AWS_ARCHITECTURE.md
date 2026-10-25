# CloudCloset — AWS Architecture Specification
*(AWS Storage & Database Integration — Deployment On Hold)*

---

## 1. Architectural Overview

CloudCloset is an architectural, contemporary luxury fashion e-commerce platform. In this architecture phase, the application operates as a **hybrid cloud system**:

* **Compute & Execution:** The React 19 / Vite frontend and Node.js / Express.js backend run locally on the developer machine (`http://localhost:5173` and `http://localhost:5000`).
* **Persistent Object Storage:** **Amazon S3** provides secure, high-durability cloud storage for high-resolution 3:4 portrait fashion campaign photography and product galleries.
* **Persistent Relational Database:** **Amazon RDS for PostgreSQL** provides private, ACID-compliant database storage for user identities, role permissions, inventory, shopping bags, and orders.
* **Production Hosting:** EC2 instances, Nginx web servers, PM2 process management, and CloudWatch monitoring remain **explicitly on hold** for a subsequent deployment phase.

---

## 2. System Architecture & Request Flow

```
                                  ┌─────────────────────────────┐
                                  │   Customer / Admin Browser  │
                                  │     (http://localhost:5173) │
                                  └──────────────┬──────────────┘
                                                 │
                                                 │ REST API Calls (JSON & Multipart)
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │   Node.js / Express API     │
                                  │     (http://localhost:5000) │
                                  │                             │
                                  │ • JWT & Role Middleware     │
                                  │ • S3 Image Validation       │
                                  │ • ACID Checkout Control     │
                                  └──────┬───────────────┬──────┘
                                         │               │
                     Database Connection │               │ AWS SDK v3 (Private S3 Calls)
               (PostgreSQL Pool via TLS) │               │
                                         ▼               ▼
┌───────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│           Amazon RDS for PostgreSQL       │ │                 Amazon S3                 │
│      Private Engine: PostgreSQL 16        │ │        Private Object Store Bucket        │
│                                           │ │                                           │
│ • users (bcrypt salted hashes, roles)     │ │ • Bucket: cloudcloset-atelier-assets-*    │
│ • products (60 items, stock, colors)      │ │ • Block All Public Access: ENABLED        │
│ • categories (6 luxury apparel domains)   │ │ • Encryption: SSE-S3 (AES256)             │
│ • carts & cart_items (user persistence)   │ │ • Hierarchy: products/{id}/primary.webp   │
│ • wishlists (user garment favorites)      │ │ • Presigned GET URLs for secure delivery  │
│ • orders & order_items (ACID allocation)  │ │ • Direct streaming upload via multer/S3   │
└───────────────────────────────────────────┘ └───────────────────────────────────────────┘
```

---

## 3. Request Flow Scenarios

### A. Customer Browse & Discovery Flow
1. **Catalog Request:** The browser requests garments from `GET /api/products?gender=Women&category=Outerwear`.
2. **Database Query:** The Express server queries the `products` table in Amazon RDS, returning product records with their associated `s3_key` identifiers.
3. **Presigned URL Generation:** For each garment with an `s3_key`, the backend generates a short-lived presigned URL (1 hour expiry) using `@aws-sdk/s3-request-presigner`.
4. **Secure Image Rendering:** The client loads images directly from S3 using the signed token. The S3 bucket itself remains completely private with zero public access.

### B. Admin Image Upload & Inventory Management Flow
1. **Image Selection:** The administrator selects a fashion photograph (`.webp`, `.jpg`, `.png`, max 5MB) in the Admin Dashboard.
2. **Multipart Stream:** The browser submits `POST /api/admin/upload-image` with `multipart/form-data`.
3. **MIME & Authorization Check:** Express verifies the user's JWT role (`Admin`) and validates the image MIME type via `multer`.
4. **S3 Stream:** The file buffer is streamed to Amazon S3 via `PutObjectCommand` with key `products/{productId}/primary-{timestamp}.webp`.
5. **Database Storage:** The returned S3 object key is stored in the PostgreSQL `products.s3_key` column.

### C. Transactional Order Allocation Flow
1. **Checkout Initiation:** The customer submits cart items and delivery details to `POST /api/orders/checkout`.
2. **Transaction Start:** Express initiates an atomic transaction (`BEGIN`).
3. **Row Locking & Inventory Check:** Each product row is locked (`SELECT ... FOR UPDATE`) to verify `stock_count >= requested_qty`.
4. **Atomic Decrement:** Stock is decremented (`UPDATE products SET stock_count = stock_count - qty`).
5. **Order Record Creation:** The order and line items are written to `orders` and `order_items`.
6. **Cart Cleanup & Commit:** The customer's cart is cleared and the transaction commits (`COMMIT`).
7. **Rollback Safety:** If any item is out of stock, the transaction aborts (`ROLLBACK`) with zero inventory discrepancy.

---

## 4. Role of Each AWS Service

| Service | Architecture Role | Rationale for Selection |
| :--- | :--- | :--- |
| **Amazon S3** | Persistent product image storage | 99.999999999% (11 9's) data durability, highly granular IAM access controls, Block Public Access compliance, and native presigned URL support for private delivery. |
| **Amazon RDS (PostgreSQL)** | Persistent application relational database | ACID transactions for guaranteed inventory integrity, native `JSONB` support for apparel color swatches and size matrices, automated backups, and private subnet isolation. |
| **AWS IAM** | Identity and Access Management | Granular least-privilege policies granting only `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` for the specific CloudCloset bucket. |

---

## 5. Security Architecture Summary

* **No Hardcoded Credentials:** AWS credentials and database connection strings exist exclusively in local environment files (`.env`), which are excluded by `.gitignore`.
* **Zero Direct Database Exposure:** The browser never connects directly to PostgreSQL. All database interactions occur through authenticated Express endpoints.
* **Strict Role Enforcement:** Administrative operations (`/api/admin/*`) require verified server-side JWT signatures with the `Admin` role.
* **Private S3 Bucket:** Block Public Access is strictly enabled; unauthorized public GET requests receive `403 Forbidden`.

---

## 6. Estimated Monthly Cost Considerations

| Service | Sizing / Plan | Free Tier Status | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Amazon S3** | Standard Storage (< 1 GB, ~200 photos) | 5 GB Free (12 mos) | **$0.00** |
| **Amazon RDS** | `db.t3.micro` PostgreSQL (20 GB gp3) | 750 hrs/mo Free (12 mos) | **$0.00** (~$13.50/mo after Free Tier) |
| **Total Estimated Demo Cost** | | | **$0.00 / ₹0.00** |
