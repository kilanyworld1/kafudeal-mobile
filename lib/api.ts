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

export const authAPI = {
  async getOrCreateCustomer(authUserId: string, fallbackEmail?: string, fallbackName?: string): Promise<Customer | null> {
    // Try to find an existing customer
    const { data: existing } = await supabase
      .from("customers")
      .select("id, auth_user_id, full_name, email, phone, country_code")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id,
        authUserId: existing.auth_user_id,
        fullName: existing.full_name,
        email: existing.email,
        phone: existing.phone,
        countryCode: existing.country_code,
      };
    }

    // Create a new one
    const { data: created, error } = await supabase
      .from("customers")
      .insert({
        auth_user_id: authUserId,
        email: fallbackEmail,
        full_name: fallbackName,
      })
      .select()
      .single();

    if (error || !created) return null;
    return {
      id: created.id,
      authUserId: created.auth_user_id,
      fullName: created.full_name,
      email: created.email,
      phone: created.phone,
      countryCode: created.country_code,
    };
  },

  async updateCustomer(customerId: string, patch: Partial<Customer>) {
    const { data, error } = await supabase
      .from("customers")
      .update({
        full_name: patch.fullName,
        phone: patch.phone,
        country_code: patch.countryCode,
      })
      .eq("id", customerId)
      .select()
      .single();
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
  async getOrders(customerId: string): Promise<{ data: Order[]; error: any }> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, products(*, partners(name)))")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
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
    subtotal: number;
    delivery_fee: number;
    total: number;
    address_id?: string;
    payment_method?: string;
    voucher_code?: string;
    items: { product_id: string; quantity: number; price: number }[];
  }) {
    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: payload.customer_id,
        subtotal: payload.subtotal,
        delivery_fee: payload.delivery_fee,
        total: payload.total,
        address_id: payload.address_id,
        payment_method: payload.payment_method,
        voucher_code: payload.voucher_code,
        order_status: "confirmed",
      })
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
