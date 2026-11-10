// Supabase Edge Function: payment-webhook
// Handles Paystack and Flutterwave Webhook Signatures, Idempotency, and Order Updates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const FLUTTERWAVE_SECRET_HASH = Deno.env.get("FLUTTERWAVE_SECRET_HASH") ?? "";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const paystackSignature = req.headers.get("x-paystack-signature");
    const flutterwaveSignature = req.headers.get("verif-hash");

    let provider = "unknown";
    let isValid = false;

    // Validate Paystack HMAC SHA512
    if (paystackSignature && PAYSTACK_SECRET_KEY) {
      provider = "paystack";
      const encoder = new TextEncoder();
      const keyData = encoder.encode(PAYSTACK_SECRET_KEY);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(rawBody));
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      isValid = calculatedSignature === paystackSignature;
    } 
    // Validate Flutterwave Hash
    else if (flutterwaveSignature && FLUTTERWAVE_SECRET_HASH) {
      provider = "flutterwave";
      isValid = flutterwaveSignature === FLUTTERWAVE_SECRET_HASH;
    }

    if (!isValid && Deno.env.get("ENVIRONMENT") === "production") {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Compute payload hash for deduplication
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawBody));
    const payloadHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    let eventId = "";
    let eventType = "";
    let reference = "";
    let isSuccess = false;

    if (provider === "paystack") {
      eventId = String(payload.data?.id || payload.event);
      eventType = payload.event;
      reference = payload.data?.reference || "";
      isSuccess = payload.event === "charge.success";
    } else {
      eventId = String(payload.id || payload.data?.id || Date.now());
      eventType = payload.event || "charge.completed";
      reference = payload.data?.tx_ref || "";
      isSuccess = payload.data?.status === "successful";
    }

    // Check duplicate event in payment_events
    const { data: existingEvent } = await supabase
      .from("payment_events")
      .select("id")
      .eq("provider", provider)
      .eq("provider_event_id", eventId)
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ status: "ignored", message: "Duplicate event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Record event
    await supabase.from("payment_events").insert({
      provider,
      provider_event_id: eventId,
      event_type: eventType,
      payload_hash: payloadHash,
      payload,
    });

    if (isSuccess && reference) {
      // Find matching order by reference or order_number
      const { data: payment } = await supabase
        .from("payments")
        .select("id, order_id, amount, status")
        .eq("provider_reference", reference)
        .single();

      if (payment) {
        // Update payment to successful
        await supabase
          .from("payments")
          .update({
            status: "successful",
            verified_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        // Update order status to paid and confirmed
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.order_id);

        // Add history entry
        await supabase.from("order_status_history").insert({
          order_id: payment.order_id,
          previous_status: "pending",
          new_status: "confirmed",
          actor_type: "webhook",
          notes: `Verified via ${provider} webhook (ref: ${reference})`,
        });
      }
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
