# Dera Buzor Lounge — Google Cloud Run & Supabase Deployment Guide

## 1. Architecture Summary
- **Frontend:** React 19 SPA with TypeScript and Tailwind CSS.
- **Backend Server:** Node.js Express server (`server.ts`) hosting API routes, webhook validation, and serving static assets in production.
- **Database & Auth:** Supabase PostgreSQL with 18 relational tables, Row-Level Security, and Storage.
- **Hosting:** Google Cloud Run (Containerized, auto-scaling 0 to 5 instances, stateless).
- **Payment Gateway:** Paystack (Primary) + Flutterwave (Secondary).
- **Timezone:** Africa/Lagos (UTC+1).

---

## 2. Supabase Provisioning & Setup

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project named `dera-buzor-lounge`.
2. Select the closest region (e.g. `eu-west-1` or `eu-central-1` for West African latency).

### Step 2: Apply SQL Migrations
1. Open the Supabase **SQL Editor**.
2. Run `supabase/migrations/20261109000000_dera_buzor_schema.sql` to create all 18 tables, indexes, and RLS policies.
3. Run `supabase/migrations/20261109000001_seed_dera_buzor_data.sql` to populate delivery zones, categories, products, and restaurant settings.

### Step 3: Deploy Edge Functions
Using the Supabase CLI:
```bash
supabase functions deploy payment-webhook
supabase functions deploy create-order
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...
supabase secrets set FLUTTERWAVE_SECRET_HASH=...
```

---

## 3. Google Cloud Run Deployment

### Container Specifications
- **Service Name:** `dera-buzor-lounge`
- **Port:** `8080` (or `process.env.PORT`)
- **Listen Address:** `0.0.0.0`
- **Health Check Endpoint:** `/health`
- **Startup Command:** `npm start`
- **Build Command:** `npm run build`
- **Concurrency:** `40`
- **Min Instances:** `0` (Scale to zero for cost savings)
- **Max Instances:** `5`

### Environment Variables & Secrets
Configure in Google Cloud Console > Cloud Run > Variables & Secrets:

| Variable Name | Description | Example |
|---|---|---|
| `NODE_ENV` | Production mode | `production` |
| `PORT` | Container Port | `8080` |
| `SUPABASE_URL` | Supabase API URL | `https://xyz.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase Service Role Key | `eyJhb...` |
| `PAYMENT_PROVIDER` | Active gateway | `paystack` |
| `PAYSTACK_SECRET_KEY` | Paystack Secret API Key | `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | Paystack Public Key | `pk_live_...` |
| `BUSINESS_TIMEZONE` | Authoritative timezone | `Africa/Lagos` |
| `DEFAULT_CURRENCY` | Base currency | `NGN` |
| `WHATSAPP_BUSINESS_NUMBER` | Kitchen phone | `+2348145550192` |

---

## 4. Paystack Webhook Configuration
1. In the Paystack Dashboard, navigate to **Settings > API Keys & Webhooks**.
2. Under **Live Webhook URL**, enter:
   `https://<your-cloud-run-domain>/api/payments/webhook`
3. The server computes the HMAC SHA-512 signature using `PAYSTACK_SECRET_KEY` and updates orders transactionally without frontend intervention.

---

## 5. Production Smoke Test
Once deployed:
1. `curl -f https://<your-cloud-run-domain>/health` (Returns `{"status": "ok"}`).
2. Open website on mobile browser and verify layout.
3. Submit test order via Paystack / Bank transfer.
4. Verify order appears on `/api/admin/orders`.
