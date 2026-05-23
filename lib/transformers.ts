import { Product, Category, Partner, Order } from "./types";

function fmtEndsIn(expiryDate?: string | null) {
  if (!expiryDate) return "";
  const now = new Date();
  const exp = new Date(expiryDate);
  const ms = exp.getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d left`;
  return `${Math.floor(days / 7)}w left`;
}

export function transformProduct(p: any): Product {
  const now = new Date();
  const expDate = p.expiry_date ? new Date(p.expiry_date) : null;
  const expiryDays = expDate
    ? Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const original = Number(p.original_price) || 0;
  const discounted = Number(p.discounted_price) || original;
  const discountPct =
    Number(p.discount_percentage) ||
    (original > 0 ? Math.round((1 - discounted / original) * 100) : 0);

  return {
    id: String(p.id),
    name: p.name || "",
    description: p.description || "",
    originalPrice: original,
    discountedPrice: discounted,
    discountPercentage: discountPct,
    image: p.image_url || "",
    store: p.partners?.name || p.partner_name || "VERIFIED STORE",
    category: p.categories?.name || p.category_name || "",
    categoryId: p.category_id,
    partnerId: p.partner_id,
    expiryDays,
    expiryDate: p.expiry_date,
    stock: p.stock || 0,
    rating: Number(p.rating) || 0,
    sku: p.sku,
    status: p.status,
    // aliases for the v2 UI
    price: discounted,
    was: original,
    discount: discountPct,
    endsIn: fmtEndsIn(p.expiry_date),
    urgent: expiryDays <= 1,
  };
}

export function transformCategory(c: any): Category {
  return {
    id: String(c.id),
    name: c.name || "",
    icon: c.icon || "",
    image: c.image_url || "",
    count: c.product_count || 0,
  };
}

export function transformPartner(p: any): Partner {
  return {
    id: String(p.id),
    name: p.name || "",
    type: p.type || "",
    domain: p.domain || "",
    initials: p.initials || "",
    color: p.color || "#000",
    bgColor: p.bg_color || "#FFF",
    accentColor: p.accent_color || "#000",
    logoUrls: p.logo_url ? [p.logo_url] : [],
    status: p.status,
    listedProducts: p.listed_products || 0,
    activeProducts: p.active_products || 0,
  };
}

export function transformOrder(o: any): Order {
  return {
    id: String(o.id),
    // Real orders table doesn't have a short_id column — derive one from the UUID
    shortId: o.short_id || String(o.id).slice(0, 8).toUpperCase(),
    status: o.order_status || o.status || "pending",
    // Use updated_at (created_at doesn't exist on the orders table)
    createdAt: o.updated_at || o.created_at,
    total: Number(o.total) || 0,
    itemsCount: o.items_count || (o.order_items?.length ?? 0),
    items: o.order_items?.map((oi: any) => ({
      product: oi.products ? transformProduct(oi.products) : ({} as Product),
      qty: oi.quantity,
      price: Number(oi.price) || 0,
    })),
  };
}
