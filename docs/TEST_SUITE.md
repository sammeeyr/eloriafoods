# Dera Buzor Lounge — Automated & Functional Test Suite

## 1. Test Matrix Overview
This document outlines the test cases, verification scripts, and acceptance validations executed across all modules of Dera Buzor Lounge.

---

## 2. Test Cases & Execution Results

### Group 1: Daily Menu Engine
| ID | Test Scenario | Expected Outcome | Result |
|---|---|---|---|
| DM-01 | Africa/Lagos Date Resolution | Resolves business date using UTC+1 regardless of client browser timezone. | **PASS** |
| DM-02 | Unpublished Menu Protection | When daily menu status is `'draft'`, `/api/menu/today` returns an informative kitchen notice and zero items. | **PASS** |
| DM-03 | Sold-out Item Visibility | Items toggled to `isAvailable: false` display "Sold Out Today" badge and disable Add button. | **PASS** |
| DM-04 | Stock Deduction | Placing an order for 2 portions decreases `availableQuantity` by 2; hitting 0 marks item sold out. | **PASS** |
| DM-05 | Date-Specific Pricing | Daily menu `displayPrice` takes precedence over product `basePrice`. | **PASS** |

### Group 2: Ordering & Cart Validation
| ID | Test Scenario | Expected Outcome | Result |
|---|---|---|---|
| ORD-01 | Server-Side Price Authority | Client cannot tamper with prices. The server fetches prices from the database/memory and computes subtotal. | **PASS** |
| ORD-02 | Duplicate Order Idempotency | Resubmitting with the same `idempotencyKey` returns the existing order number and avoids duplicate items. | **PASS** |
| ORD-03 | Cart Empty Submission | Submitting empty items array returns HTTP 400 with "Cart cannot be empty". | **PASS** |
| ORD-04 | Inactive Dish Order Attempt | Submitting order for an inactive dish returns HTTP 400 "Dish unavailable". | **PASS** |
| ORD-05 | Promotional Code Validation | `RELAX10` applies 10% discount only when order $\ge$ ₦10,000. Under threshold returns validation error. | **PASS** |

### Group 3: Fulfilment & Delivery
| ID | Test Scenario | Expected Outcome | Result |
|---|---|---|---|
| FUL-01 | Pickup Fulfilment Fee | Selecting 'pickup' sets `deliveryFee = 0` and requires pickup time selection. | **PASS** |
| FUL-02 | Delivery Zone Calculation | Selecting 'Lekki Phase 1' attaches ₦1,500 fee; 'Ikoyi' attaches ₦2,500. | **PASS** |
| FUL-03 | Inactive Delivery Zone | If delivery zone is inactive, checkout rejects with "Selected delivery zone is unavailable". | **PASS** |
| FUL-04 | Missing Delivery Address | Delivery orders submitted without address return HTTP 400 with explicit validation error. | **PASS** |

### Group 4: Payment Verification & Webhooks
| ID | Test Scenario | Expected Outcome | Result |
|---|---|---|---|
| PAY-01 | Paystack Signature Validation | Webhook compares `x-paystack-signature` using HMAC SHA-512 against raw request body. | **PASS** |
| PAY-02 | Duplicate Webhook Deduplication | Webhook computes SHA-256 hash of payload. Duplicate payloads return `status: ignored`. | **PASS** |
| PAY-03 | Bank Transfer Verification | Orders with Bank Transfer remain `paymentStatus: pending` until authorized manager clicks verify. | **PASS** |
| PAY-04 | Order Status Transition | Successful payment automatically transitions `orderStatus` from `pending` to `confirmed`. | **PASS** |

### Group 5: Administrator Security & Access Control
| ID | Test Scenario | Expected Outcome | Result |
|---|---|---|---|
| SEC-01 | Unauthorized Admin Access | Accessing `/api/admin/*` without valid credentials returns HTTP 401 Unauthorized. | **PASS** |
| SEC-02 | RLS Public Restriction | Anonymous clients cannot read unpublished menus or access other customers' records. | **PASS** |
| SEC-03 | No Privileged Keys in Frontend | `SUPABASE_SECRET_KEY` and `PAYSTACK_SECRET_KEY` are isolated to server runtime. | **PASS** |

### Group 6: Responsive Viewports
| ID | Device Profile | Viewport | Verification |
|---|---|---|---|
| MOB-01 | iPhone 14/15 Pro | 390 x 844 | Top bar stacks cleanly, sticky bottom bag button, touch targets $\ge 44$px. |
| MOB-02 | Android Samsung Galaxy | 412 x 915 | Fast scrolling, native dialer integration, WhatsApp intent links. |
| TAB-01 | iPad Pro | 820 x 1180 | 2-column dish grid, modal centering, full receipt visibility. |
| DSK-01 | Desktop Baseline | 1440 x 900 | 3-column dish grid, split hero ambience, drawer animations. |
