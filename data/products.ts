// Re-exports for backward compatibility with v2 screens.
// Real product data is fetched live via productsAPI in lib/api.ts.
export type { Product, Category } from "../lib/types";

// Static category chip metadata for the home screen carousel.
// Real categories from Supabase are merged with these for icons/colors.
export const categories = [
  { key: "snacks", label: "Snacks", emoji: "🍫", tint: "#FFE7D1", tag: "−70%", hot: true },
  { key: "fresh", label: "Fresh", emoji: "🥬", tint: "#E5F4DE", tag: "Fast" },
  { key: "bakery", label: "Bakery", emoji: "🥖", tint: "#FFF1D6" },
  { key: "beauty", label: "Beauty", emoji: "💄", tint: "#FBEAF0" },
  { key: "dairy", label: "Dairy", emoji: "🥛", tint: "#EAF3FF" },
  { key: "drinks", label: "Drinks", emoji: "🥤", tint: "#FFE7D1" },
  { key: "frozen", label: "Frozen", emoji: "🧊", tint: "#E5F4DE" },
];

// Empty array kept as a fallback so old imports don't crash.
import type { Product } from "../lib/types";
export const products: Product[] = [];
export const endingSoon: Product[] = [];
export const topDeals: Product[] = [];
export const freshAndBakery: Product[] = [];
export const beautyDeals: Product[] = [];
