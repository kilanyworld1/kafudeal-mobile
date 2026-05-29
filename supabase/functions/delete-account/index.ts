// Supabase Edge Function: delete-account
//
// Permanently deletes the authenticated user's account and associated data.
// Called from the mobile app's Settings → Delete account flow.
//
// Deploy:
//   supabase functions deploy delete-account
//
// Or via Supabase Dashboard:
//   Edge Functions → New function → name: "delete-account" → paste this code.
//
// This function uses the SUPABASE_SERVICE_ROLE_KEY which is automatically
// available inside Edge Functions — you don't need to add it manually.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verify the calling user is authenticated (uses their JWT)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Use service role client for the actual deletion (bypasses RLS)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Find the customer row for this auth user
    const { data: customer } = await adminClient
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customer?.id) {
      const customerId = customer.id;

      // Anonymize orders — keep the rows for legal/accounting (UAE VAT
      // requires 5-year retention), but disconnect from the customer.
      await adminClient
        .from("orders")
        .update({ customer_id: null })
        .eq("customer_id", customerId);

      // Delete customer-scoped data that has no record-keeping value
      await adminClient.from("cart_items").delete().eq("customer_id", customerId);
      await adminClient.from("saved_products").delete().eq("customer_id", customerId);
      await adminClient
        .from("customer_notifications")
        .delete()
        .eq("customer_id", customerId);

      // Finally, delete the customer profile
      await adminClient.from("customers").delete().eq("id", customerId);
    }

    // 4. Delete the auth user (the login itself). After this, the JWT is
    //    invalid and the user can never sign back in with this account.
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      return new Response(
        JSON.stringify({
          error: `Auth deletion failed: ${deleteAuthError.message}`,
          partial: true,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("delete-account error:", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
