import { Product, Category, Partner, Order, Customer } from "./types";

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

/** Bridge from raw Supabase row (snake_case) to mobile UI shape (camelCase + aliases). */
export function transformProduct(p: any): Product {
  if (!p) return null as any;
  const now = new Date();
  const expDate = p.expiry_date ? new Date(p.expiry_date) : null;
  const expiryDays = expDate
    ? Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const original = Number(p.original_price) || 0;
  const discounted = Number(p.discounted_price) || original;
  // Always round so we never show 70.5% — match the web's display
  const discountPct = Math.round(
    Number(p.discount_percentage) ||
      (original > 0 ? (1 - discounted / original) * 100 : 0)
  );

  return {
    id: String(p.id),
    name: p.name || "",
    description: p.description || "",
    originalPrice: original,
    discountedPrice: discounted,
    discountPercentage: discountPct,
    image: p.image_url || "",
    store: p.partners?.name || "VERIFIED STORE",
    category: p.categories?.name || "",
    categoryId: p.category_id,
    partnerId: p.partner_id,
    expiryDays,
    expiryDate: p.expiry_date,
    stock: p.stock || 0,
    rating: Number(p.rating) || 0,
    sku: p.sku,
    status: p.status,
    // UI aliases
    price: discounted,
    was: original,
    discount: discountPct,
    endsIn: fmtEndsIn(p.expiry_date),
    urgent: expiryDays <= 1,
    // Match web: show "Expiring soon" banner for products with <= 14 days
    expiringSoon: expDate !== null && expiryDays <= 14 && expiryDays > 0,
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

export function transformCustomer(c: any): Customer | null {
  if (!c) return null;
  return {
    id: c.id,
    authUserId: c.auth_user_id,
    fullName: c.name || "",
    email: c.email || "",
    phone: c.phone || "",
    countryCode: c.country_code || "",
  };
}

/**
 * Match the orders rows returned by web's getMyOrders / getOrder:
 *   { id, total, order_status, payment_status, ordered_at, delivery_address,
 *     item_count, order_items: [{ product_name, quantity, unit_price, total_price, products: {name, image_url} }] }
 */
export function transformOrder(o: any): Order {
  return {
    id: String(o.id),
    // No short_id column on the real schema — derive a short label from the UUID
    shortId: String(o.id).slice(0, 8).toUpperCase(),
    status: o.order_status || "new",
    // Real timestamp column is ordered_at
    createdAt: o.ordered_at,
    total: Number(o.total) || 0,
    itemsCount: o.item_count ?? o.order_items?.length ?? 0,
    items: (o.order_items || []).map((oi: any) => ({
      product: oi.products
        ? transformProduct({
            id: oi.products.id ?? oi.product_id,
            name: oi.products.name ?? oi.product_name,
            image_url: oi.products.image_url,
            description: oi.products.description,
          })
        : ({
            id: oi.product_id,
            name: oi.product_name,
            image: "",
          } as any),
      qty: oi.quantity,
      price: Number(oi.unit_price) || 0,
    })),
  };
}
