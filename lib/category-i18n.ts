/**
 * Localize a category name that comes from either a hardcoded English string
 * or the database (categories.name column).
 *
 * Strategy: normalize the input (lowercase, replace spaces with underscores)
 * and look up `category.<key>` in the current language. If no match, fall
 * back to the original name so we never lose information.
 *
 * Example mappings (en → ar):
 *   "All"        → "category.all"          ✨
 *   "Top deals"  → "category.top_deals"    🔥
 *   "Snacks"     → "category.snacks"
 *   "Dairy"      → "category.dairy"
 *   "Fresh"      → "category.fresh"        🥬
 *   "Bakery"     → "category.bakery"
 *   "Beauty"     → "category.beauty"
 *   "Drinks"     → "category.drinks"
 *   "Frozen"     → "category.frozen"
 */
export function localizeCategory(
  name: string | undefined | null,
  t: (key: string, opts?: any) => string
): string {
  if (!name) return "";
  const key = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const translated = t(`category.${key}`);
  // If the key didn't exist, i18next returns the raw key string. Detect
  // that and fall back to the original name (capitalised for display).
  if (translated === `category.${key}` || !translated) {
    return name;
  }
  return translated;
}
