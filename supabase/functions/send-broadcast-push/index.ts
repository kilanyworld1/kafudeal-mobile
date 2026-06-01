// Supabase Edge Function: send-broadcast-push
//
// v12.3 — Admin-only push broadcasts, called from the admin Notifications
// page in the web app. Supports three recipient modes:
//   - "all"     → every customer
//   - "filter"  → filter by city / order history / app activity
//   - "ids"     → explicit list of customer_ids
//
// Auth model:
//   The caller MUST be signed in as an admin (auth.users → admin_users).
//   We verify by extracting their JWT, calling supabase.auth.getUser(jwt),
//   then checking admin_users for that user_id. No more "anyone with the
//   anon key can spam customers."
//
// Request body:
//   {
//     "title": "Flash sale 🔥",
//     "body":  "20% off everything",
//     "route": "/(tabs)/deals",          // optional deep link
//     "filter": { "mode": "all" }        // see filter shape below
//     // legacy: "recipients": "all" | ["uuid",...] still works
//   }
//
// Filter shape (matches resolve_broadcast_recipients RPC):
//   {
//     "mode": "all" | "filter" | "ids",
//     "ids":  ["uuid",...],
//     "cities": ["Ramallah","Dubai"],
//     "ordered_within_days": 7,
//     "never_ordered": true,
//     "min_orders": 5,
//     "active_within_days": 30,
//     "inactive_for_days": 30
//   }
//
// Response:
//   {
//     "broadcast_id":     "uuid",
//     "recipient_count":  number,   // customers the filter resolved to
//     "sent":             number,   // tokens we POSTed to Expo
//     "skipped_disabled": number,
//     "skipped_no_token": number,
//     "in_app_inserted":  number,
//     "expo_tickets":     [...]
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
    // ----- 1. Verify caller is an admin -----
    const auth = req.headers.get("Authorization") || "";
    const jwt = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!jwt) {
      return jsonResponse({ error: "Missing Authorization Bearer token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service client for DB writes (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the JWT and pull the auth user
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return jsonResponse({ error: "Invalid Bearer token" }, 401);
    }

    // Check they're in admin_users
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (adminErr || !adminRow?.id) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }
    const adminId: string = adminRow.id;

    // ----- 2. Parse body -----
    const body = await req.json().catch(() => ({}));
    const title: string = (body.title || "").trim();
    const messageBody: string = (body.body || "").trim();
    const route: string | undefined = body.route;
    const type: string = body.type ?? "broadcast";

    // Support both new "filter" and legacy "recipients"
    let filter: Record<string, unknown>;
    if (body.filter && typeof body.filter === "object") {
      filter = body.filter;
    } else if (Array.isArray(body.recipients)) {
      filter = { mode: "ids", ids: body.recipients };
    } else {
      filter = { mode: "all" };
    }

    if (!title || !messageBody) {
      return jsonResponse({ error: "title and body are required" }, 400);
    }

    // ----- 3. Resolve recipients via the SQL RPC -----
    const { data: resolvedRows, error: resolveErr } = await supabase.rpc(
      "resolve_broadcast_recipients",
      { filter }
    );
    if (resolveErr) {
      return jsonResponse(
        { error: `recipient resolution failed: ${resolveErr.message}` },
        500
      );
    }
    const customerIds: string[] = (resolvedRows || [])
      .map((r: { customer_id: string }) => r.customer_id)
      .filter(Boolean);

    const recipientCount = customerIds.length;

    // ----- 4. Pull customers w/ notifications_enabled flag -----
    let enabledCustomerIds: string[] = [];
    let disabledCount = 0;

    if (customerIds.length > 0) {
      const { data: customers, error: custErr } = await supabase
        .from("customers")
        .select("id, notifications_enabled")
        .in("id", customerIds);

      if (custErr) {
        return jsonResponse({ error: `customer lookup failed: ${custErr.message}` }, 500);
      }

      enabledCustomerIds = (customers || [])
        .filter((c) => c.notifications_enabled !== false)
        .map((c) => c.id);
      disabledCount = (customers || []).length - enabledCustomerIds.length;
    }

    // ----- 5. In-app notification rows for EVERY targeted customer
    //         (even those with notifications_enabled=false, so they still
    //          see the message inside the app)
    const inAppRows = customerIds.map((id) => ({
      customer_id: id,
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

    // ----- 6. Push to Expo for enabled customers w/ devices -----
    let sentCount = 0;
    let noTokenCount = 0;
    const expoTickets: unknown[] = [];

    if (enabledCustomerIds.length > 0) {
      const { data: devices } = await supabase
        .from("customer_devices")
        .select("expo_push_token, customer_id")
        .in("customer_id", enabledCustomerIds);

      const tokens = (devices || [])
        .map((d) => d.expo_push_token)
        .filter((t): t is string => !!t);

      const customersWithTokens = new Set(
        (devices || []).map((d) => d.customer_id)
      );
      noTokenCount = enabledCustomerIds.filter(
        (id) => !customersWithTokens.has(id)
      ).length;

      if (tokens.length > 0) {
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

        // Expo accepts up to 100 messages per batch
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

        sentCount = tokens.length;

        // Mark devices as recently active
        await supabase
          .from("customer_devices")
          .update({ last_seen_at: new Date().toISOString() })
          .in("expo_push_token", tokens);
      }
    }

    // ----- 7. Log this broadcast -----
    const { data: bcastRow } = await supabase
      .from("broadcasts")
      .insert({
        title,
        body: messageBody,
        route: route || null,
        filter,
        sent_by: adminId,
        recipient_count: recipientCount,
        sent_count: sentCount,
        skipped_disabled: disabledCount,
        skipped_no_token: noTokenCount,
        in_app_inserted: inAppInsertedCount,
      })
      .select("id")
      .maybeSingle();

    return jsonResponse({
      broadcast_id: bcastRow?.id ?? null,
      recipient_count: recipientCount,
      sent: sentCount,
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
