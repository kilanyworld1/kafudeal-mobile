import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { View, Text, Image, Animated, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product, CartItem } from "./types";
import { cartAPI, savedAPI } from "./api";
import { transformProduct } from "./transformers";
import { useAuth } from "./auth-context";

// Local cart row tracks the server-side cart_items.id so we can update/delete by row id.
type LocalCartItem = CartItem & { cartItemId?: string };

type Toast = {
  id: number;
  product?: Product;
  message: string;
  kind: "cart" | "info" | "save";
};

type CartContextValue = {
  items: LocalCartItem[];
  count: number;
  subtotal: number;
  add: (p: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  badgeScale: Animated.Value;
  saved: string[];
  toggleSaved: (id: string, name?: string) => void;
  isSaved: (id: string) => boolean;
  showToast: (t: Omit<Toast, "id">) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { customer, user } = useAuth();
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const badgeScale = useRef(new Animated.Value(1)).current;
  const toastId = useRef(0);
  const prevUserRef = useRef<string | null>(null);
  // Ref-tracked items + customer-id so the cart-migration effect can read
  // the latest guest cart at sign-in time without putting `items` in its
  // dependency array (which would cause an infinite loop).
  const itemsRef = useRef<LocalCartItem[]>([]);
  const prevCustomerIdRef = useRef<string | null>(null);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const bump = () => {
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.45, duration: 140, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 2200);
  }, []);

  // Toast on auth state changes (sign in / sign out)
  useEffect(() => {
    const currentId = user?.id || null;
    const prevId = prevUserRef.current;
    if (prevId === null && currentId !== null) {
      // signed in
      const name =
        customer?.fullName ||
        (user?.user_metadata?.full_name as string) ||
        user?.email?.split("@")[0] ||
        "back";
      showToast({ message: `Welcome back, ${name} 👋`, kind: "save" });
    } else if (prevId !== null && currentId === null) {
      // signed out
      showToast({ message: "Signed out", kind: "info" });
    }
    prevUserRef.current = currentId;
  }, [user?.id, customer?.fullName]);

  // Server cart is the source of truth (matches web). Load it when the user changes.
  const refreshCart = useCallback(async () => {
    if (!customer?.id) return;
    const { data, error } = await cartAPI.getCart();
    if (error || !data) return;
    const mapped: LocalCartItem[] = (data as any[])
      .filter((r) => r.products)
      .map((r) => ({
        cartItemId: r.id,
        product: transformProduct(r.products),
        qty: r.quantity,
      }));
    setItems(mapped);
  }, [customer?.id]);

  useEffect(() => {
    const currentId = customer?.id || null;
    const prevId = prevCustomerIdRef.current;
    prevCustomerIdRef.current = currentId;

    if (!currentId) {
      // Signed out → clear out signed-in data. Guest cart is rebuilt on
      // the next mount if/when this provider remounts.
      setItems([]);
      setSaved([]);
      return;
    }

    // Detect "guest just signed in": prev was null, current is a real id.
    // Snapshot the guest cart RIGHT NOW (before refreshCart wipes it) so
    // we can migrate those rows into the customer's server cart.
    const isSignInTransition = !prevId && currentId;
    const guestItems = isSignInTransition ? [...itemsRef.current] : [];

    let cancelled = false;
    (async () => {
      // Migrate guest cart to server BEFORE pulling the server cart down.
      // Each addToCart upserts on (customer_id, product_id) so quantities
      // are summed correctly if the customer already had this product saved.
      if (guestItems.length > 0) {
        for (const item of guestItems) {
          try {
            await cartAPI.addToCart(item.product.id, item.qty);
          } catch (e) {
            console.warn("Cart migration failed for", item.product.id, e);
          }
        }
      }

      await refreshCart();
      const { data: savedIds } = await savedAPI.getSaved();
      if (!cancelled) setSaved(savedIds);
    })();
    return () => {
      cancelled = true;
    };
  }, [customer?.id, refreshCart]);

  const add = useCallback(
    async (p: Product) => {
      // Optimistic UI
      setItems((prev) => {
        const existing = prev.find((it) => it.product.id === p.id);
        if (existing) {
          return prev.map((it) =>
            it.product.id === p.id ? { ...it, qty: Math.min(it.qty + 1, p.stock || 999) } : it
          );
        }
        return [...prev, { product: p, qty: 1 }];
      });
      bump();
      showToast({ product: p, message: "Added to cart", kind: "cart" });

      if (customer?.id) {
        const res = await cartAPI.addToCart(p.id, 1);
        if (res?.error) {
          console.warn("addToCart failed:", res.error);
          showToast({ message: "Couldn't sync cart to server", kind: "info" });
        }
        await refreshCart(); // pick up cartItemId after server insert
      }
    },
    [customer?.id, showToast, refreshCart]
  );

  const remove = useCallback(
    async (productId: string) => {
      const target = items.find((it) => it.product.id === productId);
      setItems((prev) => prev.filter((it) => it.product.id !== productId));
      if (customer?.id && target?.cartItemId) {
        await cartAPI.removeFromCart(target.cartItemId);
      }
    },
    [items, customer?.id]
  );

  const setQty = useCallback(
    async (productId: string, qty: number) => {
      if (qty <= 0) {
        remove(productId);
        return;
      }
      const target = items.find((it) => it.product.id === productId);
      setItems((prev) => prev.map((it) => (it.product.id === productId ? { ...it, qty } : it)));
      if (customer?.id && target?.cartItemId) {
        await cartAPI.updateCartQuantity(target.cartItemId, qty);
      }
    },
    [items, customer?.id, remove]
  );

  const clear = useCallback(async () => {
    setItems([]);
    if (customer?.id) await cartAPI.clearCart();
  }, [customer?.id]);

  const toggleSaved = useCallback(
    async (id: string, name?: string) => {
      const wasSaved = saved.includes(id);
      setSaved((prev) => (wasSaved ? prev.filter((x) => x !== id) : [...prev, id]));
      if (wasSaved) {
        showToast({ message: "Removed from saved", kind: "info" });
        if (customer?.id) await savedAPI.remove(id);
      } else {
        showToast({ message: name ? `${name} saved` : "Saved", kind: "save" });
        if (customer?.id) await savedAPI.add(id);
      }
    },
    [saved, customer?.id, showToast]
  );

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const count = items.reduce((a, b) => a + b.qty, 0);
  const subtotal = items.reduce((a, b) => a + b.qty * b.product.discountedPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        add,
        remove,
        setQty,
        clear,
        badgeScale,
        saved,
        toggleSaved,
        isSaved,
        showToast,
      }}
    >
      {children}
      <ToastStack toasts={toasts} />
    </CartContext.Provider>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <View pointerEvents="none" style={ts.stack}>
      {toasts.map((t, i) => (
        <ToastItem key={t.id} toast={t} index={i} />
      ))}
    </View>
  );
}

function ToastItem({ toast, index }: { toast: Toast; index: number }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 1900);
    return () => clearTimeout(t);
  }, []);

  const bgColor = toast.kind === "info" ? "#0F172A" : "#FFFFFF";
  const textColor = toast.kind === "info" ? "white" : "#0F172A";
  const iconBg = toast.kind === "cart" ? "#FFE7D1" : toast.kind === "save" ? "#FEE2E2" : "rgba(255,255,255,0.18)";
  const iconColor = toast.kind === "cart" ? "#FF6B2C" : toast.kind === "save" ? "#DC2626" : "white";

  return (
    <Animated.View
      style={[
        ts.toast,
        { backgroundColor: bgColor, transform: [{ translateY }], opacity, top: 50 + index * 64 },
      ]}
    >
      {toast.product ? (
        <Image source={{ uri: toast.product.image }} style={ts.img} />
      ) : (
        <View style={[ts.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons
            name={toast.kind === "save" ? "heart" : "checkmark-circle"}
            size={20}
            color={iconColor}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[ts.title, { color: textColor }]}>{toast.message}</Text>
        {toast.product && (
          <Text style={ts.sub} numberOfLines={1}>
            {toast.product.name}
          </Text>
        )}
      </View>
      {toast.kind === "cart" && (
        <View style={ts.checkBadge}>
          <Ionicons name="checkmark" size={14} color="white" />
        </View>
      )}
    </Animated.View>
  );
}

const ts = StyleSheet.create({
  stack: { position: "absolute", top: 0, left: 12, right: 12, zIndex: 9999, elevation: 9999 },
  toast: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 12,
    borderWidth: Platform.OS === "android" ? 0.5 : 0,
    borderColor: "rgba(15,23,42,0.06)",
  },
  img: { width: 44, height: 44, borderRadius: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "800" },
  sub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
});

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
