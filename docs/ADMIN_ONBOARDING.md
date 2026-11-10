# Dera Buzor Lounge — Administrator & Kitchen Onboarding Guide

## 1. Overview
Welcome to the operational hub of **Dera Buzor Lounge**. This guide prepares lounge managers, chefs, and floor supervisors to navigate the daily operations portal, manage the daily menu, handle incoming customer orders, and verify payments.

---

## 2. Accessing the Portal
1. Navigate to the website: `https://derabuzorlounge.com` (or preview URL).
2. Click **Staff Portal** in the header navigation or the footer link.
3. Authenticate using either:
   - **Emergency Passcode:** Configured in `ADMIN_SETUP_PASSCODE` (Default: `DeraBuzor2026!Admin`).
   - **Supabase Auth:** Authenticated profile with `role: 'admin'` or `role: 'manager'`.
4. Quick Demo Mode: Click **"Sign in with Default Admin Key"** for immediate access.

---

## 3. Daily Menu Operations (Africa/Lagos WAT)
The daily menu is the core of the platform. Unlike static restaurant menus, Dera Buzor Lounge publishes date-specific selections based on morning market supplies.

### A. Publishing Today's Menu
1. In the Staff Portal, open the **Daily Menu Control** tab.
2. The current Africa/Lagos date is resolved automatically.
3. Review current dishes and their available portions.
4. Click **"Publish Today's Menu"**. The menu immediately becomes visible to public visitors.

### B. Managing Stock & Marking "Sold Out"
- When a dish sells out or kitchen stock is depleted:
  - Locate the dish in the menu list.
  - Click **"In Stock"** to toggle to **"Marked Sold Out"**.
  - Customers will immediately see "Sold Out Today" and will be prevented from adding it to checkout.
- To re-enable when a new batch is cooked, click **"Marked Sold Out"** to return it to **"In Stock"**.

---

## 4. Live Kitchen & Order Workflow
Orders progress through a strict, authorized state machine:

```
[Pending]
   │
   ▼
[Confirmed] ──► Payment verified (Online) OR Bank alert acknowledged
   │
   ▼
[Preparing] ──► Chef fired firewood/charcoal grills
   │
   ▼
[Ready for Pickup / Out for Delivery] ──► Rider dispatched with dispatch box
   │
   ▼
[Completed] ──► Customer received delivery / picked up at counter
```

### A. Offline Payment Verification (Bank Transfers)
- When a customer selects **Direct Bank Transfer**, their order is created with `paymentStatus: 'pending'`.
- Verify the payment against the restaurant GTBank mobile app or bank alert statement:
  - Account: `0129845721` (DERA BUZOR LOUNGE & SUITES LTD)
  - Reference: Match customer name or order number (e.g. `DBL-20261109-8420`).
- In the Staff Portal, click the green **"Verify Bank Transfer"** button on the order card.
- This updates `paymentStatus` to `paid`, confirms the order, and timestamps the verification in `admin_audit_logs`.

### B. Cash on Delivery (COD) / Cash on Pickup
- Orders remain `paymentStatus: 'pending'` while being cooked and dispatched.
- Upon dispatch rider receiving cash/POS payment, the manager marks the order **"Completed"**, setting payment to settled.

---

## 5. WhatsApp Order Notifications
- Every customer is prompted on the confirmation screen to click **"Send Order Summary to Kitchen WhatsApp"**.
- The pre-formatted text includes customer name, delivery address, items, and total amount.
- Ensure the floor manager has WhatsApp Web open on `+234 814 555 0192` to acknowledge orders promptly.
