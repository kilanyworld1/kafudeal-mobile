/**
 * KafuDeal Mobile data layer — verbatim port of kafudeal.com's lib/api.js.
 *
 * Do NOT diverge from the web's shape. When the web's api.js is updated, copy
 * the changes here so both platforms stay in sync. Convert .js → .ts only.
 */

import { supabase } from "./supabase";

const handleError = (error: any) => {
  console.error("API Error:", error);
  return {
    data: null,
    error: error?.message || "An error occurred",
  };
};

/**
 * PRODUCTS API
 */
export const productsAPI = {
  getProducts: async (
    options: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      excludeExpired?: boolean;
      from?: number;
      to?: number;
    } = {}
  ) => {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        search,
        excludeExpired = true,
        from = 0,
        to = 19,
      } = options;

      let query = supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          original_price,
          discounted_price,
          discount_percentage,
          image_url,
          expiry_date,
          stock,
          category_id,
          partner_id,
          status,
          rating,
          sku,
          created_at,
          categories(id, name, icon),
          partners(id, name, logo_url, initials, color, bg_color, accent_color)
        `
        )
        .or("status.eq.published,status.is.null")
        .order("created_at", { ascending: false });

      if (category) query = query.eq("category_id", category);
      if (minPrice !== undefined) query = query.gte("discounted_price", minPrice);
      if (maxPrice !== undefined) query = query.lte("discounted_price", maxPrice);
      if (excludeExpired) {
        query = query.gt("expiry_date", new Date().toISOString().split("T")[0]);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      query = query.range(from, to);

      const { data, error } = await query;
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getProduct: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          categories(id, name, icon),
          partners(id, name, logo_url, domain, initials, color, bg_color, accent_color, email:contact_email)
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getFeaturedProducts: async (limit = 8) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          original_price,
          discounted_price,
          discount_percentage,
          image_url,
          expiry_date,
          rating,
          stock,
          categories(name, icon),
          partners(name, initials, color, bg_color)
        `
        )
        .or("status.eq.published,status.is.null")
        .gt("expiry_date", new Date().toISOString().split("T")[0])
        .order("discount_percentage", { ascending: false })
        .limit(limit);

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getProductsByCategory: async (categoryId: string, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          original_price,
          discounted_price,
          discount_percentage,
          image_url,
          expiry_date,
          rating,
          stock,
          partners(name, initials, color, bg_color)
        `
        )
        .eq("category_id", categoryId)
        .or("status.eq.published,status.is.null")
        .gt("expiry_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * CATEGORIES API
 */
export const categoriesAPI = {
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, image_url, product_count, created_at")
        .order("name", { ascending: true });

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * PARTNERS API
 */
export const partnersAPI = {
  getPartners: async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select(
          `
          id,
          name,
          type,
          logo_url,
          domain,
          initials,
          color,
          bg_color,
          accent_color,
          status,
          listed_products,
          active_products
        `
        )
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getPartner: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select(
          `
          *,
          products(
            id,
            name,
            original_price,
            discounted_price,
            discount_percentage,
            image_url,
            expiry_date,
            rating,
            stock
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * CART API (Requires Authentication)
 */
export const cartAPI = {
  getCart: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          product_id,
          quantity,
          added_at,
          products(
            id,
            name,
            original_price,
            discounted_price,
            discount_percentage,
            image_url,
            stock,
            expiry_date
          )
        `
        )
        .eq("customer_id", customer.id)
        .order("added_at", { ascending: false });

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  addToCart: async (productId: string, quantity = 1) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      // Check if product already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("customer_id", customer.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingItem) {
        const { data, error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)
          .select();

        if (error) return handleError(error);
        return { data, error: null };
      } else {
        const { data, error } = await supabase
          .from("cart_items")
          .insert([{ customer_id: customer.id, product_id: productId, quantity }])
          .select();

        if (error) return handleError(error);
        return { data, error: null };
      }
    } catch (error) {
      return handleError(error);
    }
  },

  updateCartQuantity: async (cartItemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        return cartAPI.removeFromCart(cartItemId);
      }
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId)
        .select();

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  removeFromCart: async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) return handleError(error);
      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  clearCart: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("customer_id", customer.id);

      if (error) return handleError(error);
      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * ORDERS API (Requires Authentication)
 */
export const ordersAPI = {
  // ---------------------------------------------------------------
  // createOrder — calls the server-side `place_order` RPC.
  //
  // The RPC recomputes totals from the cart on the server and splits
  // the cart into one order per partner. The client cannot influence
  // total, subtotal, payment_status, or order_status — earlier versions
  // let any of those be tampered (e.g. set total=0, mark paid, etc.).
  //
  // Required:  delivery_address (text)
  // Optional:  payment_method, notes
  //
  // Returns { data: { id }, error } so existing callers (which read
  // `data.id` to navigate to /order/[id]) keep working unchanged.
  // ---------------------------------------------------------------
  createOrder: async (orderData: Record<string, any> = {}) => {
    try {
      const delivery_address: string = orderData.delivery_address;
      if (!delivery_address || delivery_address.trim().length < 5) {
        return handleError({
          message: "Please choose a delivery address before placing the order.",
        });
      }

      const { data, error } = await supabase.rpc("place_order", {
        p_delivery_address: delivery_address,
        p_payment_method: orderData.payment_method || "Card",
        p_notes: orderData.notes ?? null,
      });

      if (error) return handleError(error);

      const primaryOrderId =
        (data && (data as any).primary_order_id) ||
        (data && (data as any).order_ids?.[0]);

      if (!primaryOrderId) {
        return handleError({ message: "Order created but no id returned." });
      }

      // Shape the response so existing callers keep working.
      return { data: { id: primaryOrderId, ...(data as object) }, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  // Legacy direct-insert createOrder — kept around for one release in case
  // the RPC migration hasn't been applied yet. Will be removed in v12.
  _createOrderLegacy: async (orderData: Record<string, any> = {}) => {
    try {
      // Strip undefined/null keys so we never send a column that's been disabled
      orderData = Object.fromEntries(
        Object.entries(orderData).filter(([_, v]) => v !== undefined && v !== null)
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      // Get cart items
      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("product_id, quantity, products(original_price, discounted_price, name)")
        .eq("customer_id", customer.id);

      if (cartError) return handleError(cartError);
      if (!cartItems || cartItems.length === 0) {
        return handleError({ message: "Cart is empty" });
      }

      const subtotal = cartItems.reduce(
        (sum: number, item: any) =>
          sum + (item.products.discounted_price || item.products.original_price) * item.quantity,
        0
      );

      const { data: firstProduct } = await supabase
        .from("products")
        .select("partner_id")
        .eq("id", cartItems[0].product_id)
        .single();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: customer.id,
            partner_id: firstProduct?.partner_id,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            item_count: cartItems.length,
            subtotal,
            total: subtotal,
            // Orders land as 'confirmed' immediately — admin progresses from there.
            order_status: "confirmed",
            payment_status: "pending",
            ...orderData,
          },
        ])
        .select()
        .single();

      if (orderError) return handleError(orderError);

      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        unit_price: item.products.discounted_price || item.products.original_price,
        total_price: (item.products.discounted_price || item.products.original_price) * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) return handleError(itemsError);

      // Clear cart
      await cartAPI.clearCart();

      return { data: order, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getMyOrders: async (opts: { from?: number; to?: number } = {}) => {
    try {
      const { from = 0, to = 49 } = opts;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          total,
          order_status,
          payment_status,
          ordered_at,
          delivery_address,
          item_count,
          order_items(
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            products(name, image_url)
          )
        `
        )
        .eq("customer_id", customer.id)
        .order("ordered_at", { ascending: false })
        // Always cap the fetch so this scales when you have many orders
        .range(from, to);

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getOrder: async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            products(id, name, image_url, description)
          )
        `
        )
        .eq("id", id)
        .eq("customer_id", customer.id)
        .single();

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * AUTH API
 *
 * NOTE: We rely on the DB trigger handle_new_user() (in supabase/v17_2_fixes.sql)
 * to create the customers row on signup. We never insert into customers manually.
 */
export const authAPI = {
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return handleError(error);
      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  getProfile: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) return handleError(error);
      return { data: data || null, error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  updateProfile: async (updates: Record<string, any>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });

      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("auth_user_id", user.id)
        .select()
        .single();

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * CONTENT API
 */
export const contentAPI = {
  getTestimonials: async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
  getFaqs: async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
  getTips: async () => {
    try {
      const { data, error } = await supabase
        .from("tips")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
  getCountries: async () => {
    try {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .order("name", { ascending: true });
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
  getExpiryFilters: async () => {
    try {
      const { data, error } = await supabase
        .from("expiry_filters")
        .select("*")
        .order("id", { ascending: true });
      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * ADDRESSES — customer-managed delivery addresses (v11.6).
 *
 * RLS on `customer_addresses` should already restrict rows to the owning
 * customer. We only need a `customer_id` join here because we don't ship
 * the auth.user_id back into the table.
 */
export const addressesAPI = {
  // Return the signed-in customer's saved addresses, default first.
  list: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: [], error: null };

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return { data: [], error: null };

      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) return handleError(error);
      return { data: data || [], error: null };
    } catch (error) {
      return handleError(error);
    }
  },

  // Format an address row into a one-line string the order can store.
  // The customer_addresses table uses `address_line`, `city`, `emirate`,
  // `phone` (UAE-style schema).
  formatForOrder: (addr: any): string => {
    if (!addr) return "";
    const parts = [
      addr.address_line,
      [addr.city, addr.emirate].filter(Boolean).join(", "),
      addr.phone,
    ].filter((s) => s && String(s).trim().length > 0);
    return parts.join(" · ");
  },

  // Save a new address. The form has more fields than the DB does, so we
  // concatenate Building / Street / Area into a single `address_line` to
  // match the existing schema. If `is_default` is true, we flip every other
  // row of this customer to false first so only one default exists.
  create: async (input: {
    label?: string;
    building?: string;
    street?: string;
    area?: string;
    city?: string;
    emirate?: string;
    phone?: string;
    is_default?: boolean;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not signed in" });

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });

      // Build a single readable address_line from the multi-field form
      const address_line = [input.building, input.street, input.area]
        .map((p) => (p || "").trim())
        .filter(Boolean)
        .join(", ");

      if (!address_line) {
        return handleError({ message: "Please fill in the building or street." });
      }
      if (!input.phone || input.phone.trim().length < 5) {
        return handleError({ message: "Please add a contact phone number." });
      }

      // If this one is set as default, clear any existing default first.
      if (input.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", customer.id)
          .eq("is_default", true);
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .insert([
          {
            customer_id: customer.id,
            label: input.label || "Home",
            address_line,
            city: input.city || null,
            emirate: input.emirate || "Dubai",
            phone: input.phone,
            is_default: !!input.is_default,
          },
        ])
        .select()
        .single();

      if (error) return handleError(error);
      return { data, error: null };
    } catch (error) {
      return handleError(error);
    }
  },
};


/**
 * NOTIFICATIONS — mobile-side reads of rows written by DB triggers (v8).
 * Inserts happen server-side via SECURITY DEFINER triggers on `orders`.
 */
export const notificationsAPI = {
  list: async (limit = 50) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [], error: null };
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return { data: [], error: null };
      const { data, error } = await supabase
        .from("customer_notifications")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return handleError(error);
      return { data, error: null };
    } catch (e) {
      return handleError(e);
    }
  },

  unreadCount: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: 0, error: null };
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return { data: 0, error: null };
      const { count, error } = await supabase
        .from("customer_notifications")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customer.id)
        .eq("read", false);
      if (error) return handleError(error);
      return { data: count || 0, error: null };
    } catch (e) {
      return handleError(e);
    }
  },

  markRead: async (id: string) => {
    try {
      const { error } = await supabase
        .from("customer_notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) return handleError(error);
      return { data: { success: true }, error: null };
    } catch (e) {
      return handleError(e);
    }
  },

  markAllRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return handleError({ message: "Not authenticated" });
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return handleError({ message: "Customer profile not found" });
      const { error } = await supabase
        .from("customer_notifications")
        .update({ read: true })
        .eq("customer_id", customer.id)
        .eq("read", false);
      if (error) return handleError(error);
      return { data: { success: true }, error: null };
    } catch (e) {
      return handleError(e);
    }
  },
};

/**
 * SAVED / WISHLIST — mobile-specific addition (web doesn't have this yet).
 * Uses the saved_products table created earlier.
 */
export const savedAPI = {
  getSaved: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: [], error: null };
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!customer) return { data: [], error: null };
      const { data, error } = await supabase
        .from("saved_products")
        .select("product_id")
        .eq("customer_id", customer.id);
      if (error) return { data: [], error };
      return { data: (data || []).map((r: any) => String(r.product_id)), error: null };
    } catch (e) {
      return { data: [], error: e };
    }
  },
  add: async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!customer) return { error: "Customer profile not found" };
    return supabase.from("saved_products").insert({ customer_id: customer.id, product_id: productId });
  },
  remove: async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!customer) return { error: "Customer profile not found" };
    return supabase
      .from("saved_products")
      .delete()
      .match({ customer_id: customer.id, product_id: productId });
  },
};
