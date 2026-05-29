/**
 * Account deletion — calls the Supabase Edge Function that performs the
 * actual deletion using the service role.
 *
 * Required by Apple App Store guideline 5.1.1(v): apps that support account
 * creation must offer a way for users to delete their account from inside
 * the app, without requiring email or phone support.
 *
 * What gets deleted (handled in the Edge Function):
 *   - cart_items rows for this customer
 *   - saved_products rows for this customer
 *   - customer_notifications rows for this customer
 *   - customers row
 *   - auth.users row (the login itself)
 *
 * What gets ANONYMIZED rather than deleted:
 *   - orders: customer_id is set to NULL. We keep the order row for legal
 *     and accounting record-keeping (UAE VAT requires 5 years retention),
 *     but the customer can no longer be traced back from the order.
 */

import { supabase } from "./supabase";
import { SUPABASE_URL } from "./config";

type Result = { error: string | null };

export async function deleteMyAccount(): Promise<Result> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: "Not signed in" };
    }

    const url = `${SUPABASE_URL}/functions/v1/delete-account`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `Server returned ${res.status}: ${text || "Unknown error"}` };
    }

    const body = await res.json().catch(() => ({}));
    if (body?.success) return { error: null };
    return { error: body?.error || "Unknown error" };
  } catch (e: any) {
    return { error: e?.message || "Network error" };
  }
}
