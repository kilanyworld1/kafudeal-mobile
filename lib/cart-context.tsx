import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { Animated } from "react-native";
import { Product } from "../data/products";

type CartItem = { product: Product; qty: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  badgeScale: Animated.Value;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([
    { product: require("../data/products").products[0], qty: 1 },
    { product: require("../data/products").products[1], qty: 1 },
  ]);
  const badgeScale = useRef(new Animated.Value(1)).current;

  const bump = () => {
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.4, duration: 140, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const add = useCallback((p: Product) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === p.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === p.id ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prev, { product: p, qty: 1 }];
    });
    bump();
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.product.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      remove(id);
      return;
    }
    setItems((prev) => prev.map((it) => (it.product.id === id ? { ...it, qty } : it)));
  }, [remove]);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((a, b) => a + b.qty, 0);
  const subtotal = items.reduce((a, b) => a + b.qty * b.product.price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, add, remove, setQty, clear, badgeScale }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
