// KafuDeal mobile config
// These values are PUBLIC client-side credentials, safe to commit to a repo
// that's open to your team. They are scoped by your Supabase RLS policies.
//
// DO NOT put your service_role key here — that one bypasses RLS and must
// only be used on a trusted backend.

export const SUPABASE_URL = "https://dtaewpcmwjzctrispmch.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0YWV3cGNtd2p6Y3RyaXNwbWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTU2NzQsImV4cCI6MjA5MTU3MTY3NH0.otrXZ3getsmZx11e51Hft0FzPzS7yzBrBl1Z6RPUsI8";

// Deep link scheme used for OAuth redirect (matches app.json -> scheme)
export const APP_SCHEME = "kafudeal";

// Default delivery + currency
export const DELIVERY_FEE = 15;
export const FREE_DELIVERY_THRESHOLD = 100;
export const CURRENCY = "AED";
