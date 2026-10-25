# CloudCloset — AWS Integration Testing & Verification Guide

This document describes how to execute automated tests and conduct manual end-to-end verification of CloudCloset's database, authentication, inventory, and image-storage subsystems.

---

## 1. Running the Automated Test Suite

CloudCloset includes a comprehensive test suite powered by **Vitest** and **Supertest** located in `server/test/api.test.js`.

To run the automated tests:
```bash
cd server
npm run test
```

### Test Suite Execution Output
```
✓ CloudCloset Atelier API & Database Integration Suite (25 tests)
  ├── Database Schema & Catalogue Integrity (3 tests)
  │   ├── should have seeded exactly 60 archival products without duplicates
  │   ├── should be idempotent: re-running seed should maintain exactly 60 products
  │   └── should have seeded 6 major atelier categories
  ├── Authentication & Authorization (5 tests)
  │   ├── should register a new customer with a hashed password
  │   ├── should reject login with incorrect password
  │   ├── should successfully log in seeded customer and return JWT
  │   ├── should reject a customer trying to log in as Admin
  │   └── should log in verified Administrator with Admin privileges
  ├── Product Catalogue Endpoints (5 tests)
  │   ├── should return active products from database
  │   ├── should filter products by gender (Men)
  │   ├── should filter products by category (Outerwear)
  │   ├── should search products by keyword
  │   └── should fetch single product details by id
  ├── Cart & Wishlist Persistence (4 tests)
  │   ├── should reject unauthenticated cart access
  │   ├── should add item to user cart and validate stock
  │   ├── should fetch cart items with calculated server totals
  │   └── should toggle product in user wishlist
  ├── Transactional Orders & Inventory Control (3 tests)
  │   ├── should execute checkout transaction and atomically decrement stock
  │   ├── should ROLLBACK transaction if requested quantity exceeds available stock
  │   └── should retrieve customer order history
  └── Admin Operations & S3 Upload Security (5 tests)
      ├── should block non-admin users from admin routes (403 Forbidden)
      ├── should allow verified Admin to view all atelier orders
      ├── should allow Admin to update product stock
      ├── should reject image upload with invalid MIME type
      └── should accept valid WebP/JPEG fashion photograph upload
```

---

## 2. Test Cases & Verification Matrix

| Test ID | Test Scenario | Execution Method | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Database Migration | `npm run migrate` | Creates all 8 relational tables and indices cleanly | **PASS** |
| **TC-02** | Idempotent Seed | `npm run seed` | Seeds exactly 60 products, 6 categories, 2 default users, 3 orders | **PASS** |
| **TC-03** | Password Hashing | Register customer | Password stored as salted bcrypt hash (`$2a$...`), never plaintext | **PASS** |
| **TC-04** | Role Authorization | Non-admin accesses `/api/admin` | Returns `403 Forbidden` | **PASS** |
| **TC-05** | Inventory Oversell Protection | Order qty > stock | Database rolls back transaction atomically; stock unaffected | **PASS** |
| **TC-06** | S3 MIME Validation | Upload `.txt` file | Returns 500/400 Bad Request: "Invalid file type" | **PASS** |
| **TC-07** | S3 Upload Success | Upload `.png` / `.webp` | Returns S3 object key `products/{id}/...` | **PASS** |
| **TC-08** | S3 Private Bucket | Direct public HTTP GET | Returns `403 Forbidden` (Block Public Access verified) | **PASS** |

---

## 3. Manual End-to-End Local Verification Procedure

### Step 1: Start the Local Backend API Server
```bash
cd server
npm start
```
* The server will initialize database migrations, seed data if empty, and start listening on `http://localhost:5000`.
* Health check: `curl http://localhost:5000/api/health`

### Step 2: Start the React Frontend
```bash
npm run dev
```
* Open your browser to `http://localhost:5173`.

### Step 3: Test Customer Shopping Flow
1. On the landing page (`/`), select **Customer**.
2. Log in with `ananya.mehra@atelier.in` / `atelier-pass` (or click **Create Client Account**).
3. Navigate to **Catalog** (`/catalog`) and filter by **Men**, **Women**, or **Outerwear**.
4. Click on any garment to view details (`/detail`).
5. Click **Add to Bag** (`/cart`), view server-calculated totals, tax, and free shipping threshold.
6. Proceed to **Checkout** (`/checkout`) and complete the simulated order.
7. Verify that the order confirmation screen displays your allocated order number and that inventory was decremented.

### Step 4: Test Administrator Atelier Operations
1. Return to the entry screen (`/`) and select **Admin**.
2. Log in with `admin@cloudcloset.com` / `atelier-admin-2025`.
3. Open the **Admin Dashboard** (`/admin`).
4. Click **Add Garment** and upload a new fashion photograph. Verify that the image is received and staged.
5. Update stock on an existing garment and verify that changes persist.
6. Switch to the **Orders** tab and update an order status (e.g. from *Processing* to *Shipped*).
