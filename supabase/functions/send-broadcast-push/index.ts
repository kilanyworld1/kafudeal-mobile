// Supabase Edge Function: send-broadcast-push
//
// Admin-initiated broadcasts. Called manually (curl / Postman / Dashboard
// invoke / eventually a web admin UI). Lets an admin send a custom push
// notification to "all" customers or to a specific list of customer_ids.
//
// Request body:
//   {
//     "title": "Flash sale 🔥",
//     "body":  "20% off everything in Bakery — today only.",
//     "route": "/product/abc-123",          // optional deep link
//     "recipients": "all" | ["uuid1","uuid2",...]
//   }
//
// Authentication: requires the SERVICE_ROLE_KEY in the Authorization
// header (Bearer <key>). This makes it admin-only — never expose this
// function with the anon key.
//
// Response:
//   {
//     "sent":            number,     // tokens we successfully POSTed
//     "skipped_disabled": number,    // customers with notifications_enabled=false
//     "skipped_no_token": number,    // customers with zero registered devices
//     "in_app_inserted": number,     // rows added to customer_notifications
//     "expo_tickets":    [...]       // raw Expo Push API response
//   }

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    // ----- 1. Auth: require service role key in Authorization header -----
    const auth = req.headers.get("Authorization") || "";
    const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    if (auth !== expected) {
      return jsonResponse({ error: "Unauthorized — admin only" }, 401);
    }

    // ----- 2. Parse body -----
    const body = await req.json().catch(() => ({}));
    const title: string = body.title?.trim();
    const messageBody: string = body.body?.trim();
    const route: string | undefined = body.route;
    const recipients: "all" | string[] = body.recipients ?? "all";
    const type: string = body.type ?? "broadcast";

    if (!title || !messageBody) {
      return jsonResponse({ error: "title and body are required" }, 400);
    }
    if (
      recipients !== "all" &&
      !(Array.isArray(recipients) && recipients.every((id) => typeof id === "string"))
    ) {
      return jsonResponse(
        { error: "recipients must be 'all' or an array of customer_id strings" },
        400
      );
    }

    // ----- 3. Resolve recipient set -----
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let customerQuery = supabase
      .from("customers")
      .select("id, notifications_enabled");
    if (recipients !== "all") {
      customerQuery = customerQuery.in("id", recipients);
    }
    const { data: customers, error: custErr } = await customerQuery;
    if (custErr) {
      return jsonResponse({ error: `customer lookup failed: ${custErr.message}` }, 500);
    }

    const enabledCustomerIds = (customers || [])
      .filter((c) => c.notifications_enabled !== false)
      .map((c) => c.id);
    const disabledCount = (customers || []).length - enabledCustomerIds.length;

    // ----- 4. In-app notification rows for EVERY targeted customer
    //         (even those with notifications_enabled=false, so they see
    //         the message next time they open the app)
    const inAppRows = (customers || []).map((c) => ({
      customer_id: c.id,
      type,
      title,
      body: messageBody,
      related_id: route || null,
      related_type: route?.startsWith("/order/")
        ? "order"
        : route?.startsWith("/product/")
        ? "product"
        : null,
      read: false,
    }));
    let inAppInsertedCount = 0;
    if (inAppRows.length > 0) {
      const { error: inAppErr, count } = await supabase
        .from("customer_notifications")
        .insert(inAppRows, { count: "exact" });
      if (inAppErr) {
        console.warn("in-app insert failed:", inAppErr.message);
      } else {
        inAppInsertedCount = count || inAppRows.length;
      }
    }

    if (enabledCustomerIds.length === 0) {
      return jsonResponse({
        sent: 0,
        skipped_disabled: disabledCount,
        skipped_no_token: 0,
        in_app_inserted: inAppInsertedCount,
        note: "no customers eligible for push",
      });
    }

    // ----- 5. Pull every push token for the enabled customers -----
    const { data: devices } = await supabase
      .from("customer_devices")
      .select("expo_push_token, customer_id")
      .in("customer_id", enabledCustomerIds);

    const tokens = (devices || [])
      .map((d) => d.expo_push_token)
      .filter((t): t is string => !!t);

    const customersWithTokens = new Set((devices || []).map((d) => d.customer_id));
    const noTokenCount = enabledCustomerIds.filter(
      (id) => !customersWithTokens.has(id)
    ).length;

    if (tokens.length === 0) {
      return jsonResponse({
        sent: 0,
        skipped_disabled: disabledCount,
        skipped_no_token: noTokenCount,
        in_app_inserted: inAppInsertedCount,
        note: "no devices registered for the eligible customers",
      });
    }

    // ----- 6. Build push messages -----
    // Expo accepts up to 100 messages per batch — chunk if larger.
    const data: Record<string, unknown> = { type };
    if (route) data.route = route;

    const messages = tokens.map((to) => ({
      to,
      title,
      body: messageBody,
      sound: "default",
      priority: "high",
      data,
      channelId: "default",
    }));

    // ----- 7. POST to Expo Push API in chunks of 100 -----
    const expoTickets: unknown[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      const json = await res.json().catch(() => ({}));
      expoTickets.push(json);
    }

    // Mark these devices as recently active
    await supabase
      .from("customer_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .in("expo_push_token", tokens);

    return jsonResponse({
      sent: tokens.length,
      skipped_disabled: disabledCount,
      skipped_no_token: noTokenCount,
      in_app_inserted: inAppInsertedCount,
      expo_tickets: expoTickets,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-broadcast-push error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
