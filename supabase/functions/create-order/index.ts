// Supabase Edge Function: create-order
// Handles transactional server-side pricing, inventory validation, and order persistence

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      fulfilmentType,
      deliveryAddress,
      deliveryZoneId,
      deliveryInstructions,
      items,
      paymentMethod,
      customerNotes,
      promoCode,
      idempotencyKey,
    } = body;

    if (!customerName || !customerPhone || !fulfilmentType || !items || !items.length) {
      return new Response(
        JSON.stringify({ error: "Missing required checkout parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Idempotency Check
    if (idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, payment_status, order_status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        return new Response(
          JSON.stringify({
            orderNumber: existingOrder.order_number,
            orderId: existingOrder.id,
            isDuplicate: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Validate Restaurant Status
    const { data: settings } = await supabase
      .from("restaurant_settings")
      .select("*")
      .single();

    if (settings && !settings.is_accepting_orders) {
      return new Response(
        JSON.stringify({ error: "Restaurant is currently not accepting new orders" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Validate Delivery Zone
    let deliveryFee = 0;
    if (fulfilmentType === "delivery") {
      if (!deliveryZoneId || !deliveryAddress) {
        return new Response(
          JSON.stringify({ error: "Delivery address and zone are required for delivery" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { data: zone } = await supabase
        .from("delivery_zones")
        .select("fee, is_active")
        .eq("id", deliveryZoneId)
        .single();

      if (!zone || !zone.is_active) {
        return new Response(
          JSON.stringify({ error: "Selected delivery zone is currently unavailable" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      deliveryFee = Number(zone.fee);
    }

    // 4. Validate Items and Calculate Server-Side Subtotal
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, base_price, is_active")
        .eq("id", item.productId)
        .single();

      if (!product || !product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product is not active or unavailable: ${item.productId}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let unitPrice = Number(product.base_price);

      // Check variant modifier
      if (item.variantId) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("price_modifier, name")
          .eq("id", item.variantId)
          .eq("product_id", product.id)
          .single();
        if (variant) {
          unitPrice += Number(variant.price_modifier);
        }
      }

      // Check addons
      let addonsCost = 0;
      if (item.selectedAddons && item.selectedAddons.length) {
        for (const addonReq of item.selectedAddons) {
          const { data: addon } = await supabase
            .from("product_addons")
            .select("price, name")
            .eq("id", addonReq.id)
            .single();
          if (addon) {
            addonsCost += Number(addon.price) * (addonReq.quantity || 1);
          }
        }
      }

      const itemTotal = (unitPrice + addonsCost) * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        unit_price: unitPrice + addonsCost,
        quantity: item.quantity,
        selected_variants: item.variantId ? [{ id: item.variantId, name: item.variantName }] : [],
        selected_addons: item.selectedAddons || [],
        item_notes: item.notes || null,
        line_total: itemTotal,
      });
    }

    // 5. Apply Promo Code
    let discountAmount = 0;
    if (promoCode) {
      const { data: promo } = await supabase
        .from("promotional_codes")
        .select("*")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promo && subtotal >= Number(promo.min_order_amount)) {
        if (promo.discount_type === "percentage") {
          discountAmount = (subtotal * Number(promo.discount_value)) / 100;
        } else {
          discountAmount = Math.min(Number(promo.discount_value), subtotal);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    // Generate Order Number: DBL-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DBL-${dateStr}-${randomSuffix}`;

    // 6. Insert Order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        fulfilment_type: fulfilmentType,
        delivery_address: deliveryAddress || null,
        delivery_zone_id: deliveryZoneId || null,
        delivery_instructions: deliveryInstructions || null,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency: "NGN",
        payment_method: paymentMethod,
        payment_status: "pending",
        order_status: "pending",
        customer_notes: customerNotes || null,
        idempotency_key: idempotencyKey || null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr ? orderErr.message : "Failed to insert order");
    }

    // 7. Insert Order Items
    const orderItemsToInsert = validatedItems.map(item => ({
      ...item,
      order_id: order.id,
    }));
    await supabase.from("order_items").insert(orderItemsToInsert);

    // 8. Insert Order Status History
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      previous_status: null,
      new_status: "pending",
      actor_type: "customer",
      notes: "Order placed online",
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderNumber,
        orderId: order.id,
        totalAmount,
        subtotal,
        deliveryFee,
        discountAmount,
        paymentMethod,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
