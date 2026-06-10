/**
 * Localized "time remaining until expiry" formatter.
 *
 * Replaces the hardcoded English "5d left" / "Tomorrow" / "Expired" strings
 * that used to live in transformers.ts. Pass the product's expiry_date and
 * the `t` function from useTranslation; get back a localized string.
 *
 * Rules:
 *   - past expiry  → "Expired"
 *   - < 24h        → "Xh left"
 *   - exactly 1d   → "Tomorrow"
 *   - 1–6 days     → "Xd left"
 *   - 7+ days      → "Xw left"
 */
export function formatTimeRemaining(
  expiryDate: string | null | undefined,
  t: (key: string, opts?: any) => string
): string {
  if (!expiryDate) return "";

  const now = new Date();
  const exp = new Date(expiryDate);
  const ms = exp.getTime() - now.getTime();

  if (ms <= 0) return t("product.expired");

  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return t("product.hours_left", { hours });

  const days = Math.floor(hours / 24);
  if (days === 1) return t("product.tomorrow");
  if (days < 7) return t("product.days_left", { days });

  const weeks = Math.floor(days / 7);
  return t("product.weeks_left", { weeks });
}
