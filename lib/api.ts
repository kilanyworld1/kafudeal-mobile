import { supabase } from "./supabase";
import {
  transformProduct,
  transformCategory,
  transformPartner,
  transformOrder,
} from "./transformers";
import type { Product, Category, Partner, Order, Customer } from "./types";

// ─── PRODUCTS ───────────────────────────────────────────────────────────────

export const productsAPI = {
  async getProducts(opts: { from?: number; to?: number; excludeExpired?: boolean } = {}) {
    const { from = 0, to = 999, excludeExpired = false } = opts;
    let q = supabase
      .from("products")
      .select("*, partners(name, logo_url), categories(name, icon)")
      .order("discount_percentage", { ascending: false })
      .range(from, to);

    if (excludeExpired) {
      q = q.gte("expiry_date", new Date().toISOString().slice(0, 10));
    }
    const { data, error } = await q;
    return { data: (data || []).map(transformProduct) as Product[], error };
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, partners(name, logo_url), categories(name, icon)")
      .eq("id", id)
      .maybeSingle();
    return { data: data ? transformProduct(data) : null, error };
  },

  async getByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, partners(name, logo_url), categories(name, icon)")
      .eq("category_id", categoryId)
      .order("discount_percentage", { ascending: false });
    return { data: (data || []).map(transformProduct) as Product[], error };
  },

  async getByPartner(partnerId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, partners(name, logo_url), categories(name, icon)")
      .eq("partner_id", partnerId);
    return { data: (data || []).map(transformProduct) as Product[], error };
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, partners(name, logo_url), categories(name, icon)")
      .ilike("name", `%${query}%`)
      .limit(50);
    return { data: (data || []).map(transformProduct) as Product[], error };
  },
};

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export const categoriesAPI = {
  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    return { data: (data || []).map(transformCategory) as Category[], error };
  },
};

// ─── PARTNERS ───────────────────────────────────────────────────────────────

export const partnersAPI = {
  async getPartners() {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("status", "approved");
    return { data: (data || []).map(transformPartner) as Partner[], error };
  },

  async getPartnerById(id: string) {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return { data: data ? transformPartner(data) : null, error };
  },
};

// ─── CONTENT (CMS-like) ─────────────────────────────────────────────────────

export const contentAPI = {
  async getTestimonials() {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    return { data: data || [], error };
  },
  async getFaqs() {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("order_index", { ascending: true });
    return {
      data: (data || []).map((f: any) => ({ id: f.id, q: f.question, a: f.answer })),
      error,
    };
  },
  async getTips() {
    const { data, error } = await supabase
      .from("tips")
      .select("*")
      .order("created_at", { ascending: false });
    return {
      data: (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        excerpt: t.excerpt || "",
        image: t.image_url || "",
        readTime: t.read_time ? `${t.read_time} min read` : "",
        content: t.content,
      })),
      error,
    };
  },
  async getCountries() {
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .order("name");
    return {
      data: (data || []).map((c: any) => ({
        code: c.code,
        flag: c.flag_emoji || "",
        name: c.name,
        short: c.short_name || c.name,
        live: c.is_live || false,
      })),
      error,
    };
  },
  async getExpiryFilters() {
    const { data, error } = await supabase
      .from("expiry_filters")
      .select("*")
      .order("min_days", { ascending: true });
    return {
      data: (data || []).map((f: any) => ({
        id: f.id,
        label: f.label,
        min: f.min_days ?? 0,
        max: f.max_days ?? 9999,
      })),
      error,
    };
  },
};

// ─── AUTH / CUSTOMER ────────────────────────────────────────────────────────

// Map a raw customers row (any shape) → app Customer type.
// Be defensive about column names since the real schema only has: id, auth_user_id, email, name, created_at.
function toCustomer(row: any): Customer | null {
  if (!row) return null;
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.name || row.full_name || "",
    email: row.email,
    phone: row.phone || "",
    countryCode: row.country_code || "",
  };
}

export const authAPI = {
  async getOrCreateCustomer(authUserId: string, fallbackEmail?: string, fallbackName?: string): Promise<Customer | null> {
    // 1) Try by auth_user_id
    const byAuth = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (byAuth.data) return toCustomer(byAuth.data);

    // 2) Maybe an older customer row exists with the same email but no auth_user_id link.
    //    Adopt it by setting its auth_user_id, so future logins find it.
    if (fallbackEmail) {
      const byEmail = await supabase
        .from("customers")
        .select("*")
        .eq("email", fallbackEmail)
        .maybeSingle();
      if (byEmail.data) {
        // If it's already linked to another user, just return it (don't clobber).
        // Otherwise, link this auth user to it.
        if (!byEmail.data.auth_user_id) {
          const linked = await supabase
            .from("customers")
            .update({ auth_user_id: authUserId })
            .eq("id", byEmail.data.id)
            .select()
            .maybeSingle();
          if (linked.data) return toCustomer(linked.data);
        }
        return toCustomer(byEmail.data);
      }
    }

    // 3) Create new (using actual column name `name`, not `full_name`)
    const { data: created } = await supabase
      .from("customers")
      .insert({
        auth_user_id: authUserId,
        email: fallbackEmail,
        name: fallbackName,
      })
      .select()
      .maybeSingle();
    return toCustomer(created);
  },

  async updateCustomer(customerId: string, patch: Partial<Customer>) {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: patch.fullName,
        // phone / country_code intentionally omitted (columns may not exist)
      })
      .eq("id", customerId)
      .select()
      .maybeSingle();
    return { data, error };
  },
};

// ─── CART ───────────────────────────────────────────────────────────────────

export const cartAPI = {
  async getCart(customerId: string) {
    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity, products(*, partners(name, logo_url), categories(name, icon))")
      .eq("customer_id", customerId);
    return {
      data: (data || [])
        .filter((r: any) => r.products)
        .map((r: any) => ({
          product: transformProduct(r.products),
          qty: r.quantity,
        })),
      error,
    };
  },

  async upsertItems(customerId: string, items: { product_id: string; quantity: number }[]) {
    const rows = items.map((i) => ({
      customer_id: customerId,
      product_id: i.product_id,
      quantity: i.quantity,
    }));
    const { data, error } = await supabase
      .from("cart_items")
      .upsert(rows, { onConflict: "customer_id,product_id" });
    return { data, error };
  },

  async removeItem(customerId: string, productId: string) {
    return supabase.from("cart_items").delete().match({ customer_id: customerId, product_id: productId });
  },

  async clear(customerId: string) {
    return supabase.from("cart_items").delete().eq("customer_id", customerId);
  },
};

// ─── ORDERS ─────────────────────────────────────────────────────────────────

export const ordersAPI = {
  // Match the web behavior: find orders by customer_id OR snapshot email,
  // and order by updated_at (the actual timestamp column on this table).
  async getOrders(customerId: string, customerEmail?: string): Promise<{ data: Order[]; error: any }> {
    let q = supabase
      .from("orders")
      .select("*, order_items(*, products(*, partners(name)))");

    if (customerEmail) {
      q = q.or(`customer_id.eq.${customerId},customer_email.eq.${customerEmail}`);
    } else {
      q = q.eq("customer_id", customerId);
    }

    const { data, error } = await q.order("updated_at", { ascending: false });
    return { data: (data || []).map(transformOrder), error };
  },

  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, products(*, partners(name)))")
      .eq("id", orderId)
      .maybeSingle();
    return { data: data ? transformOrder(data) : null, error };
  },

  async createOrder(payload: {
    customer_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
    payment_method?: string;
    voucher_code?: string;
    items: { product_id: string; quantity: number; price: number }[];
  }) {
    // Insert order. Stick to a minimal set of columns that we know exist on the
    // orders table (id, customer_id, customer_name, customer_email, customer_phone,
    // total, order_status, updated_at). Extra fields are best-effort.
    const insertRow: Record<string, any> = {
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      total: payload.total,
      order_status: "confirmed",
    };
    // optional columns — Supabase silently ignores undefined values
    if (payload.subtotal != null) insertRow.subtotal = payload.subtotal;
    if (payload.delivery_fee != null) insertRow.delivery_fee = payload.delivery_fee;
    if (payload.payment_method) insertRow.payment_method = payload.payment_method;
    if (payload.voucher_code) insertRow.voucher_code = payload.voucher_code;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert(insertRow)
      .select()
      .single();
    if (orderErr || !order) return { data: null, error: orderErr };

    // Insert order items
    const rows = payload.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) return { data: null, error: itemsErr };

    return { data: order, error: null };
  },
};

// ─── SAVED / WISHLIST ───────────────────────────────────────────────────────

export const savedAPI = {
  async getSaved(customerId: string): Promise<{ data: string[]; error: any }> {
    const { data, error } = await supabase
      .from("saved_products")
      .select("product_id")
      .eq("customer_id", customerId);
    return { data: (data || []).map((r: any) => String(r.product_id)), error };
  },
  async add(customerId: string, productId: string) {
    return supabase
      .from("saved_products")
      .insert({ customer_id: customerId, product_id: productId });
  },
  async remove(customerId: string, productId: string) {
    return supabase
      .from("saved_products")
      .delete()
      .match({ customer_id: customerId, product_id: productId });
  },
};
