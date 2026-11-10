# Dera Buzor Lounge — Security & Architecture Review Report

**Date:** 9 November 2026  
**Auditor:** Lead Systems Security & Cloud Engineer  
**System:** Dera Buzor Lounge Online Ordering Engine  
**Classification:** Production Readiness Certification  

---

## 1. Executive Summary
A comprehensive security review was performed on Dera Buzor Lounge's ordering architecture, database schema, payment gateways, and backend endpoints. The system enforces strict zero-trust principles: **no client totals are trusted, secrets are never exposed to browser bundles, webhook signatures are cryptographically validated, and database access is governed by PostgreSQL Row-Level Security (RLS)**.

---

## 2. Threat Modeling & Mitigations

### Threat 1: Price Tampering / Forged Order Totals
- **Vector:** An attacker intercepts the HTTP request and changes `lineTotal` or `totalAmount` to a lower figure (e.g. ₦100 instead of ₦14,500).
- **Mitigation:** The server completely ignores any totals submitted in the payload. It queries `products` and `daily_menu_items`, recalculates variants, addons, and quantities, validates delivery zone fees on the backend, and issues the authoritative total directly to the payment gateway.

### Threat 2: Duplicate Order Submissions (Double Debiting)
- **Vector:** A user rapidly double-clicks the checkout button or a network glitch retries the request.
- **Mitigation:** Every checkout session generates a client UUID `idempotencyKey`. The backend records this key. Repeated requests with the same key safely return the previously created order record without creating duplicate orders or reserving double inventory.

### Threat 3: Webhook Forgery & Replay Attacks
- **Vector:** An attacker posts fake `charge.success` events to `/api/payments/webhook`.
- **Mitigation:**
  1. **Signature Verification:** The raw payload buffer is verified using `crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)`. If the `x-paystack-signature` header does not match, the request is immediately rejected.
  2. **Event Deduplication:** The backend calculates a SHA-256 hash of the payload and checks `payment_events`. Duplicate events are idempotently ignored.
  3. **Order Status Guard:** Orders are only updated if the payment amount matches the order total.

### Threat 4: Unauthorized Access to Manager Controls
- **Vector:** An unauthenticated visitor navigates to administrative endpoints to change menu prices or mark orders delivered.
- **Mitigation:** All administrative endpoints require session tokens and validate user roles. Supabase RLS policies enforce `role IN ('admin', 'manager')` on mutation queries.

### Threat 5: Exposure of Privileged API Secrets
- **Vector:** Bundling secret keys into client-side code visible in Chrome DevTools.
- **Mitigation:**
  - Client bundle only contains public keys (`VITE_SUPABASE_PUBLISHABLE_KEY`, `PAYSTACK_PUBLIC_KEY`).
  - `SUPABASE_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, and `FLUTTERWAVE_SECRET_HASH` are exclusively loaded into the server environment runtime via Cloud Run environment variables / Secret Manager.

---

## 3. Database Security & Auditability
- **Audit Logs:** Every status transition is written to `order_status_history` with actor type (`customer`, `admin`, `system`, `webhook`), actor ID, previous status, new status, and timestamp.
- **Offline Payment Accountability:** When a manager confirms a bank transfer, their admin ID is logged alongside the verification notes.
- **Data Immortality:** Order items are saved as immutable snapshot records (`product_name_snapshot`, `unit_price`, `quantity`, `line_total`). Updating a menu dish later never corrupts past historical order receipts.

---

## 4. Certification
The application adheres to OWASP Top 10 guidelines for web applications and meets all security requirements specified for production deployment.
