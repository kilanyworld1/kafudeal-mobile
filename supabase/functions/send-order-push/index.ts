// Supabase Edge Function: send-order-push
//
// Called by a Supabase Database Webhook whenever a row in `orders` is
// UPDATEd. We compare old vs new order_status, and if it changed we:
//   1. Look up the customer's push tokens (filtered by notifications_enabled)
//   2. Send a push to each token via the Expo Push API
//   3. Insert a row in customer_notifications so the in-app history list
//      also shows the update
//
// Webhook payload shape (Supabase Database Webhooks):
//   {
//     "type": "UPDATE",
//     "table": "orders",
//     "schema": "public",
//     "record":     { ...new row... },
//     "old_record": { ...old row... }
//   }
//
// Tap behavior: the push payload includes data.route = "/order/<id>" so
// the mobile app's notification tap handler deep-links into the order.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Status -> push title/body. The body is a function so we can interpolate
// the order id or other fields later. Keep messages short — Android lock
// screens truncate after ~50 chars.
const STATUS_MESSAGES: Record<
  string,
  { title: string; body: (orderId: string) => string }
> = {
  confirmed: {
    title: "🎉 Order confirmed!",
    body: () => "We've received your order. We'll let you know when it ships.",
  },
  preparing: {
    title: "👨‍🍳 Preparing your order",
    body: () => "We're packing your items. Hang tight!",
  },
  out_for_delivery: {
    title: "🛵 Your order is on the way!",
    body: () => "Tap to track your delivery.",
  },
  delivered: {
    title: "✅ Order delivered",
    body: () => "Enjoy! Tap to rate your experience.",
  },
  cancelled: {
    title: "Order cancelled",
    body: () => "Your order has been cancelled. Tap to view details.",
  },
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = await req.json();

    // Webhook shape from Supabase Database Webhooks
    const type = payload?.type;
    const table = payload?.table;
    const record = payload?.record;
    const old_record = payload?.old_record;

    if (type !== "UPDATE" || table !== "orders") {
      return jsonResponse({ skipped: "not an orders UPDATE event" }, 200);
    }
    if (!record || !old_record) {
      return jsonResponse({ skipped: "missing record / old_record" }, 200);
    }

    const newStatus: string = record.order_status;
    const oldStatus: string = old_record.order_status;

    // Bail out if status didn't actually change (other columns were edited)
    if (newStatus === oldStatus) {
      return jsonResponse({ skipped: "order_status unchanged" }, 200);
    }

    // Bail out if we don't have a message for this status
    const msg = STATUS_MESSAGES[newStatus];
    if (!msg) {
      return jsonResponse(
        { skipped: `no push template for status '${newStatus}'` },
        200
      );
    }

    const customerId = record.customer_id;
    const orderId = record.id;
    if (!customerId || !orderId) {
      return jsonResponse({ error: "missing customer_id or order id" }, 400);
    }

    // Service role client — bypasses RLS so we can read across rows
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Honour the customer's notifications_enabled flag
    const { data: customer } = await supabase
      .from("customers")
      .select("id, notifications_enabled, name")
      .eq("id", customerId)
      .maybeSingle();

    if (!customer) {
      return jsonResponse({ skipped: "customer not found" }, 200);
    }
    if (customer.notifications_enabled === false) {
      // Still insert the in-app notification row so they see it next time
      // they open the app — they just opted out of OS-level pushes.
      await supabase.from("customer_notifications").insert({
        customer_id: customerId,
        type: "order_status",
        title: msg.title,
        body: msg.body(orderId),
        related_id: orderId,
        related_type: "order",
        read: false,
      });
      return jsonResponse({ skipped: "user disabled notifications" }, 200);
    }

    // Pull all active push tokens for this customer
    const { data: devices } = await supabase
      .from("customer_devices")
      .select("expo_push_token")
      .eq("customer_id", customerId);

    const tokens = (devices || [])
      .map((d) => d.expo_push_token)
      .filter((t): t is string => !!t);

    // Always insert the in-app notification row — even if no devices,
    // the customer should see the status update next time they open.
    await supabase.from("customer_notifications").insert({
      customer_id: customerId,
      type: "order_status",
      title: msg.title,
      body: msg.body(orderId),
      related_id: orderId,
      related_type: "order",
      read: false,
    });

    if (tokens.length === 0) {
      return jsonResponse({
        ok: true,
        note: "no devices registered, in-app notification inserted",
      });
    }

    // Build the batch payload for Expo Push API. Each message includes
    // a `data.route` so the app's notification tap handler can deep-link
    // straight to the order screen.
    const messages = tokens.map((to) => ({
      to,
      title: msg.title,
      body: msg.body(orderId),
      sound: "default",
      priority: "high",
      data: {
        route: `/order/${orderId}`,
        type: "order_status",
        order_id: orderId,
        new_status: newStatus,
      },
      channelId: "default",
    }));

    const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const pushBody = await pushRes.json().catch(() => ({}));

    // Update last_seen_at on devices we just pushed to so we know they're
    // still alive (and so we can prune dead tokens later).
    await supabase
      .from("customer_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .in("expo_push_token", tokens);

    return jsonResponse({
      ok: true,
      sent: tokens.length,
      old_status: oldStatus,
      new_status: newStatus,
      expo_response: pushBody,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-order-push error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
