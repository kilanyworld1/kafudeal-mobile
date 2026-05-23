import { useRef } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCart } from "../../lib/cart-context";

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, count, setQty, remove } = useCart();
  const delivery = items.length > 0 ? (subtotal >= 100 ? 0 : 15) : 0;
  const total = subtotal + delivery;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Your cart</Text>
        <Text style={s.subtitle}>{count} {count === 1 ? "item" : "items"}</Text>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Add deals you love and check out when ready</Text>
          <Pressable onPress={() => router.push("/(tabs)/deals")} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Browse deals</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 200 }}>
            {items.map((it) => (
              <CartItemRow
                key={it.product.id}
                product={it.product}
                qty={it.qty}
                onInc={() => setQty(it.product.id, it.qty + 1)}
                onDec={() => setQty(it.product.id, it.qty - 1)}
                onRemove={() => remove(it.product.id)}
              />
            ))}

            <View style={s.summary}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Subtotal</Text>
                <Text style={s.summaryVal}>AED {subtotal.toFixed(2)}</Text>
              </View>
              <View style={[s.summaryRow, { marginTop: 8 }]}>
                <Text style={s.summaryLbl}>Delivery {subtotal >= 100 ? "(free)" : ""}</Text>
                <Text style={[s.summaryVal, delivery === 0 && { color: "#16A34A" }]}>
                  {delivery === 0 ? "FREE" : `AED ${delivery.toFixed(2)}`}
                </Text>
              </View>
              {subtotal < 100 && (
                <Text style={s.freeShipHint}>
                  Add AED {(100 - subtotal).toFixed(2)} more for FREE delivery
                </Text>
              )}
              <View style={s.divider} />
              <View style={s.summaryRow}>
                <Text style={s.totalLbl}>Total</Text>
                <Text style={s.totalVal}>AED {total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={s.checkoutWrap}>
            <Pressable onPress={() => router.push("/checkout")} style={s.checkoutBtn}>
              <Text style={s.checkoutText}>Checkout · AED {total.toFixed(2)}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function CartItemRow({
  product, qty, onInc, onDec, onRemove,
}: {
  product: any; qty: number;
  onInc: () => void; onDec: () => void; onRemove: () => void;
}) {
  const qtyScale = useRef(new Animated.Value(1)).current;
  const incBg = useRef(new Animated.Value(0)).current;
  const decBg = useRef(new Animated.Value(0)).current;

  const bumpQty = () => {
    Animated.sequence([
      Animated.timing(qtyScale, { toValue: 1.3, duration: 130, useNativeDriver: true }),
      Animated.spring(qtyScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };
  const flash = (val: Animated.Value) => {
    Animated.sequence([
      Animated.timing(val, { toValue: 1, duration: 90, useNativeDriver: false }),
      Animated.timing(val, { toValue: 0, duration: 240, useNativeDriver: false }),
    ]).start();
  };

  const incBgColor = incBg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F1EFE8", "#FF6B2C"],
  });
  const decBgColor = decBg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F1EFE8", qty === 1 ? "#FEE2E2" : "#FF6B2C"],
  });

  return (
    <View style={s.item}>
      <Image source={{ uri: product.image }} style={s.itemImg} />
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View>
          <Text style={s.itemName} numberOfLines={1}>{product.name}</Text>
          <Text style={s.itemStore}>{product.store}</Text>
        </View>
        <View style={s.itemRow}>
          <Text style={s.itemPrice}>AED {(product.discountedPrice * qty).toFixed(2)}</Text>
          <View style={s.qty}>
            <Pressable
              onPress={() => { onDec(); bumpQty(); flash(decBg); }}
              hitSlop={6}
            >
              <Animated.View style={[s.qtyBtn, { backgroundColor: decBgColor }]}>
                {qty === 1 ? (
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                ) : (
                  <Ionicons name="remove" size={16} color="#0F172A" />
                )}
              </Animated.View>
            </Pressable>
            <Animated.Text style={[s.qtyText, { transform: [{ scale: qtyScale }] }]}>
              {qty}
            </Animated.Text>
            <Pressable
              onPress={() => { onInc(); bumpQty(); flash(incBg); }}
              hitSlop={6}
            >
              <Animated.View style={[s.qtyBtn, { backgroundColor: incBgColor }]}>
                <Ionicons name="add" size={16} color="#0F172A" />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>
      <Pressable onPress={onRemove} style={s.removeBtn} hitSlop={6}>
        <Ionicons name="close" size={16} color="#94A3B8" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.08)",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: "center" },
  emptyBtn: {
    backgroundColor: "#FF6B2C", paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginTop: 24,
  },
  emptyBtnText: { color: "white", fontSize: 14, fontWeight: "800" },
  item: {
    flexDirection: "row", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 12,
    marginBottom: 10,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  itemImg: { width: 70, height: 70, borderRadius: 10, backgroundColor: "#F1EFE8" },
  itemName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  itemStore: { fontSize: 11, color: "#64748B", marginTop: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemPrice: { color: "#FF6B2C", fontSize: 15, fontWeight: "800" },
  qty: {
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  qtyText: { fontSize: 15, fontWeight: "800", color: "#0F172A", minWidth: 20, textAlign: "center" },
  removeBtn: {
    position: "absolute", top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  summary: { backgroundColor: "white", borderRadius: 14, padding: 16, marginTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLbl: { color: "#64748B", fontSize: 13 },
  summaryVal: { fontWeight: "700", color: "#0F172A" },
  freeShipHint: { color: "#FF6B2C", fontSize: 11.5, fontWeight: "700", marginTop: 6 },
  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)", marginVertical: 12 },
  totalLbl: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  totalVal: { fontSize: 20, fontWeight: "800", color: "#FF6B2C" },
  checkoutWrap: {
    position: "absolute", left: 0, right: 0, bottom: 84,
    padding: 16, backgroundColor: "white",
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.08)",
  },
  checkoutBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  checkoutText: { color: "white", fontSize: 15, fontWeight: "800" },
});
