import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { View, Text, Image, Animated, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product, CartItem } from "./types";
import { cartAPI, savedAPI } from "./api";
import { useAuth } from "./auth-context";

type Toast = {
  id: number;
  product?: Product;
  message: string;
  kind: "cart" | "info" | "save";
};

type CartContextValue = {
  items: CartItem[];
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
  const { customer } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const badgeScale = useRef(new Animated.Value(1)).current;
  const toastId = useRef(0);
  const lastMergedCustomerId = useRef<string | null>(null);

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

  // Merge cart + load saved when signing in
  useEffect(() => {
    if (!customer?.id) {
      lastMergedCustomerId.current = null;
      return;
    }
    if (lastMergedCustomerId.current === customer.id) return;
    lastMergedCustomerId.current = customer.id;

    (async () => {
      try {
        // Upload local cart, then re-read server cart
        if (items.length > 0) {
          await cartAPI.upsertItems(
            customer.id,
            items.map((it) => ({ product_id: it.product.id, quantity: it.qty }))
          );
        }
        const { data: serverItems } = await cartAPI.getCart(customer.id);
        if (serverItems.length > 0) setItems(serverItems);

        const { data: savedIds } = await savedAPI.getSaved(customer.id);
        setSaved(savedIds);
      } catch (e) {
        console.warn("Cart/saved sync failed:", e);
      }
    })();
  }, [customer?.id]);

  const persistCart = useCallback((nextItems: CartItem[]) => {
    if (!customer?.id) return;
    cartAPI.upsertItems(
      customer.id,
      nextItems.map((it) => ({ product_id: it.product.id, quantity: it.qty }))
    ).catch((e) => console.warn("cart upsert failed", e));
  }, [customer?.id]);

  const add = useCallback((p: Product) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === p.id);
      const next = existing
        ? prev.map((it) => (it.product.id === p.id ? { ...it, qty: Math.min(it.qty + 1, p.stock || 999) } : it))
        : [...prev, { product: p, qty: 1 }];
      persistCart(next);
      return next;
    });
    bump();
    showToast({ product: p, message: "Added to cart", kind: "cart" });
  }, [persistCart, showToast]);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.product.id !== id);
      if (customer?.id) cartAPI.removeItem(customer.id, id).catch(() => {});
      return next;
    });
  }, [customer?.id]);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      remove(id);
      return;
    }
    setItems((prev) => {
      const next = prev.map((it) => (it.product.id === id ? { ...it, qty } : it));
      persistCart(next);
      return next;
    });
  }, [remove, persistCart]);

  const clear = useCallback(() => {
    setItems([]);
    if (customer?.id) cartAPI.clear(customer.id).catch(() => {});
  }, [customer?.id]);

  const toggleSaved = useCallback((id: string, name?: string) => {
    setSaved((prev) => {
      if (prev.includes(id)) {
        if (customer?.id) savedAPI.remove(customer.id, id).catch(() => {});
        showToast({ message: "Removed from saved", kind: "info" });
        return prev.filter((x) => x !== id);
      }
      if (customer?.id) savedAPI.add(customer.id, id).catch(() => {});
      showToast({ message: name ? `${name} saved` : "Saved", kind: "save" });
      return [...prev, id];
    });
  }, [customer?.id, showToast]);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const count = items.reduce((a, b) => a + b.qty, 0);
  const subtotal = items.reduce((a, b) => a + b.qty * b.product.discountedPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items, count, subtotal,
        add, remove, setQty, clear,
        badgeScale,
        saved, toggleSaved, isSaved,
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
          <Ionicons name={toast.kind === "save" ? "heart" : "checkmark-circle"} size={20} color={iconColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[ts.title, { color: textColor }]}>{toast.message}</Text>
        {toast.product && <Text style={ts.sub} numberOfLines={1}>{toast.product.name}</Text>}
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
  stack: {
    position: "absolute", top: 0, left: 12, right: 12,
    zIndex: 9999, elevation: 9999,
  },
  toast: {
    position: "absolute", left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: "#0F172A", shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 }, shadowRadius: 24,
    elevation: 12,
    borderWidth: Platform.OS === "android" ? 0.5 : 0,
    borderColor: "rgba(15,23,42,0.06)",
  },
  img: { width: 44, height: 44, borderRadius: 10 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "800" },
  sub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  checkBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center",
  },
});

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
