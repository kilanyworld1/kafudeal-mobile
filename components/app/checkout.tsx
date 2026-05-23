import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCart } from "../lib/cart-context";
import { useAuth } from "../lib/auth-context";
import { ordersAPI } from "../lib/api";

const addresses = [
  { id: "a1", label: "Home", line: "Marina Towers, Tower 3, Apt 1402", area: "Dubai Marina · JLT", default: true },
  { id: "a2", label: "Work", line: "Boulevard Plaza, Office 22", area: "Downtown Dubai", default: false },
];

const payments = [
  { id: "p1", label: "Visa ending in 4242", icon: "card-outline" as const },
  { id: "p2", label: "Cash on Delivery", icon: "cash-outline" as const },
  { id: "p3", label: "Apple Pay", icon: "logo-apple" as const },
];

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, clear } = useCart();
  const { customer } = useAuth();
  const [addr, setAddr] = useState("a1");
  const [pay, setPay] = useState("p1");
  const [voucher, setVoucher] = useState("");
  const [vApplied, setVApplied] = useState(false);
  const [placing, setPlacing] = useState(false);

  const delivery = subtotal >= 100 ? 0 : 15;
  const discount = vApplied ? 5 : 0;
  const total = Math.max(0, subtotal + delivery - discount);

  const placeOrder = async () => {
    if (items.length === 0) return;

    // Without a logged-in customer, just simulate the order locally
    if (!customer?.id) {
      const orderId = "K" + Math.floor(100000 + Math.random() * 900000).toString();
      clear();
      router.replace(`/order/${orderId}`);
      return;
    }

    setPlacing(true);
    const { data, error } = await ordersAPI.createOrder({
      customer_id: customer.id,
      subtotal,
      delivery_fee: delivery,
      total,
      payment_method: payments.find((p) => p.id === pay)?.label || "Card",
      voucher_code: vApplied ? voucher : undefined,
      items: items.map((it) => ({
        product_id: it.product.id,
        quantity: it.qty,
        price: it.product.discountedPrice,
      })),
    });
    setPlacing(false);

    if (error || !data) {
      Alert.alert("Couldn't place order", (error as any)?.message || "Please try again.");
      return;
    }
    clear();
    router.replace(`/order/${data.id}`);
  };

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Address */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Delivery address</Text>
          <Pressable onPress={() => router.push("/addresses")}>
            <Text style={s.sectionLink}>Manage</Text>
          </Pressable>
        </View>
        {addresses.map((a) => {
          const active = addr === a.id;
          return (
            <Pressable
              key={a.id}
              onPress={() => setAddr(a.id)}
              style={[s.card, active && s.cardActive]}
            >
              <View style={s.cardRow}>
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.labelRow}>
                    <Text style={s.cardLabel}>{a.label}</Text>
                    {a.default && (
                      <View style={s.defaultPill}>
                        <Text style={s.defaultPillText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardLine}>{a.line}</Text>
                  <Text style={s.cardArea}>{a.area}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={() => router.push("/add-address")} style={s.addAddrBtn}>
          <Ionicons name="add-circle-outline" size={18} color="#FF6B2C" />
          <Text style={s.addAddrText}>Add new address</Text>
        </Pressable>

        {/* Delivery slot */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Delivery slot</Text>
        <View style={s.card}>
          <View style={s.slotRow}>
            <View style={s.slotIcon}>
              <Ionicons name="flash" size={20} color="#FF6B2C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.slotTitle}>Express · 2 hours</Text>
              <Text style={s.slotSub}>Arrives by 4:30 PM today</Text>
            </View>
            <Text style={s.slotPrice}>AED 15</Text>
          </View>
        </View>

        {/* Payment */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Payment method</Text>
        {payments.map((p) => {
          const active = pay === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPay(p.id)}
              style={[s.card, active && s.cardActive]}
            >
              <View style={s.cardRow}>
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
                <Ionicons name={p.icon} size={22} color="#0F172A" style={{ marginRight: 10 }} />
                <Text style={s.payLabel}>{p.label}</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Voucher */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Voucher</Text>
        <View style={s.voucherRow}>
          <TextInput
            value={voucher}
            onChangeText={(t) => { setVoucher(t); setVApplied(false); }}
            placeholder="Enter code"
            placeholderTextColor="#94A3B8"
            style={s.voucherInput}
            autoCapitalize="characters"
          />
          <Pressable
            onPress={() => voucher.length >= 3 && setVApplied(true)}
            style={[s.voucherBtn, vApplied && { backgroundColor: "#16A34A" }]}
          >
            <Text style={s.voucherBtnText}>{vApplied ? "Applied" : "Apply"}</Text>
          </Pressable>
        </View>
        {vApplied && (
          <View style={s.voucherOk}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={s.voucherOkText}>5 AED off applied</Text>
          </View>
        )}

        {/* Order summary */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Order summary</Text>
        <View style={s.card}>
          {items.length === 0 ? (
            <Text style={{ color: "#64748B", fontSize: 13 }}>Your cart is empty.</Text>
          ) : (
            items.map((it) => (
              <View key={it.product.id} style={s.itemRow}>
                <Image source={{ uri: it.product.image }} style={s.itemImg} />
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName} numberOfLines={1}>{it.product.name}</Text>
                  <Text style={s.itemMeta}>Qty {it.qty}</Text>
                </View>
                <Text style={s.itemPrice}>AED {(it.product.price * it.qty).toFixed(2)}</Text>
              </View>
            ))
          )}
          <View style={s.divider} />
          <View style={s.sumRow}>
            <Text style={s.sumLbl}>Subtotal</Text>
            <Text style={s.sumVal}>AED {subtotal.toFixed(2)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLbl}>Delivery</Text>
            <Text style={s.sumVal}>AED {delivery.toFixed(2)}</Text>
          </View>
          {vApplied && (
            <View style={s.sumRow}>
              <Text style={s.sumLbl}>Voucher</Text>
              <Text style={[s.sumVal, { color: "#16A34A" }]}>− AED {discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={s.divider} />
          <View style={s.sumRow}>
            <Text style={s.totalLbl}>Total</Text>
            <Text style={s.totalVal}>AED {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={placeOrder} style={[s.placeBtn, (items.length === 0 || placing) && { opacity: 0.6 }]} disabled={items.length === 0 || placing}>
          {placing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={s.placeBtnText}>
              {items.length === 0 ? "Cart is empty" : `Place order · AED ${total.toFixed(2)}`}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  backBtn: { padding: 6 },
  topTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  sectionLink: { color: "#FF6B2C", fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: "white", borderRadius: 14, padding: 14,
    marginBottom: 10,
    borderWidth: 1.5, borderColor: "transparent",
  },
  cardActive: { borderColor: "#FF6B2C", backgroundColor: "#FFF4EC" },
  cardRow: { flexDirection: "row", alignItems: "center" },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: "#CBD5E1",
    marginRight: 12,
    alignItems: "center", justifyContent: "center",
  },
  radioActive: { borderColor: "#FF6B2C" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF6B2C" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  defaultPill: { backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultPillText: { color: "#166534", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  cardLine: { fontSize: 13, color: "#334155", marginTop: 4 },
  cardArea: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  addAddrBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,107,44,0.30)",
    borderStyle: "dashed",
  },
  addAddrText: { color: "#FF6B2C", fontSize: 13, fontWeight: "800" },
  slotRow: { flexDirection: "row", alignItems: "center" },
  slotIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  slotTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  slotSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  slotPrice: { fontSize: 14, fontWeight: "800", color: "#FF6B2C" },
  payLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  voucherRow: { flexDirection: "row", gap: 8 },
  voucherInput: {
    flex: 1, backgroundColor: "white", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#0F172A", letterSpacing: 1,
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
  },
  voucherBtn: {
    backgroundColor: "#0F172A", borderRadius: 12,
    paddingHorizontal: 18, alignItems: "center", justifyContent: "center",
  },
  voucherBtnText: { color: "white", fontSize: 13, fontWeight: "800" },
  voucherOk: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  voucherOkText: { color: "#166534", fontSize: 12, fontWeight: "700" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  itemImg: { width: 40, height: 40, borderRadius: 8 },
  itemName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  itemMeta: { fontSize: 11, color: "#64748B", marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)", marginVertical: 10 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  sumLbl: { fontSize: 13, color: "#64748B" },
  sumVal: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  totalLbl: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  totalVal: { fontSize: 20, fontWeight: "800", color: "#FF6B2C" },
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: "white",
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.08)",
  },
  placeBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  placeBtnText: { color: "white", fontSize: 15, fontWeight: "800" },
});
