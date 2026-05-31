import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useCart } from "../lib/cart-context";
import { useAuth } from "../lib/auth-context";
import { ordersAPI, addressesAPI } from "../lib/api";

// Payment options. These are display-only for now — the real payment integration
// (Stripe, Tap, etc.) is a v12 task. We just store the chosen label on the order
// so the dashboard knows what the customer picked.
const payments = [
  { id: "p1", label: "Visa ending in 4242", icon: "card-outline" as const },
  { id: "p2", label: "Cash on Delivery", icon: "cash-outline" as const },
  { id: "p3", label: "Apple Pay", icon: "logo-apple" as const },
];

type Address = {
  id: string;
  label: string;
  address_line: string;
  city?: string | null;
  emirate?: string | null;
  phone?: string | null;
  is_default?: boolean | null;
};

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, clear, showToast } = useCart();
  const { customer, session, refreshProfile } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addrId, setAddrId] = useState<string | null>(null);
  const [pay, setPay] = useState("p1");
  const [placing, setPlacing] = useState(false);

  // Pull the customer's saved addresses every time the screen comes into
  // focus. If we used a plain useEffect this would only run once, and
  // adding a new address (via /add-address) wouldn't show up here when
  // the user came back. useFocusEffect re-runs on every focus, so the
  // freshly-saved address auto-selects in checkout.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoadingAddresses(true);
        const { data } = await addressesAPI.list();
        if (!alive) return;
        const list = (data || []) as Address[];
        setAddresses(list);
        // Pick default → most recently added → keep current selection if it's still in the list
        setAddrId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev;
          const def = list.find((a) => a.is_default) || list[0];
          return def ? def.id : null;
        });
        setLoadingAddresses(false);
      })();
      return () => {
        alive = false;
      };
    }, [customer?.id])
  );

  const delivery = subtotal >= 100 ? 0 : 15;
  const total = Math.max(0, subtotal + delivery);

  const placeOrder = async () => {
    if (items.length === 0) return;

    if (!customer?.id) {
      // First, if the user IS signed in but their profile hasn't loaded
      // (this happens when the DB trigger didn't fire for this account),
      // try to refresh/create the profile before giving up on the user.
      if (session?.user) {
        const fresh = await refreshProfile();
        if (fresh?.id) {
          // Self-heal worked — fall through and place the order with `fresh`.
          // Re-enter placeOrder so the rest runs with the freshly loaded
          // customer. (The next render will have customer set, so a single
          // re-tap also works, but this is smoother UX.)
          return placeOrder();
        }
      }

      Alert.alert(
        "Sign in to place an order",
        "We'll save your cart and let you track the order. It only takes a few seconds.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign in",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }

    // The server-side RPC will refuse to create an order without a real
    // delivery address — surface that to the user before we even call.
    const selectedAddress = addresses.find((a) => a.id === addrId);
    if (!selectedAddress) {
      Alert.alert(
        "Choose a delivery address",
        "Add a delivery address so we know where to send your order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add address", onPress: () => router.push("/add-address") },
        ]
      );
      return;
    }

    setPlacing(true);
    const { data, error } = await ordersAPI.createOrder({
      delivery_address: addressesAPI.formatForOrder(selectedAddress),
      payment_method: payments.find((p) => p.id === pay)?.label || "Card",
    });
    setPlacing(false);

    if (error || !data) {
      const msg =
        typeof error === "string"
          ? error
          : (error as any)?.message || (error as any)?.details || "Please try again.";
      Alert.alert("Couldn't place order", msg);
      console.warn("createOrder failed:", error);
      return;
    }

    clear();
    showToast({ message: "Order confirmed!", kind: "cart" });
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

        {loadingAddresses ? (
          <View style={s.card}>
            <ActivityIndicator color="#FF6B2C" />
          </View>
        ) : addresses.length === 0 ? (
          <Pressable onPress={() => router.push("/add-address")} style={s.emptyCard}>
            <Ionicons name="location-outline" size={22} color="#FF6B2C" />
            <View style={{ flex: 1 }}>
              <Text style={s.emptyTitle}>No saved addresses yet</Text>
              <Text style={s.emptySub}>Add an address so we can deliver your order.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B2C" />
          </Pressable>
        ) : (
          addresses.map((a) => {
            const active = addrId === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setAddrId(a.id)}
                style={[s.card, active && s.cardActive]}
              >
                <View style={s.cardRow}>
                  <View style={[s.radio, active && s.radioActive]}>
                    {active && <View style={s.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.labelRow}>
                      <Text style={s.cardLabel}>{a.label}</Text>
                      {a.is_default && (
                        <View style={s.defaultPill}>
                          <Text style={s.defaultPillText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.cardLine}>{a.address_line}</Text>
                    {(a.city || a.emirate) ? (
                      <Text style={s.cardArea}>
                        {[a.city, a.emirate].filter(Boolean).join(", ")}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        {addresses.length > 0 && (
          <Pressable onPress={() => router.push("/add-address")} style={s.addAddrBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#FF6B2C" />
            <Text style={s.addAddrText}>Add new address</Text>
          </Pressable>
        )}

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

        {/* Voucher removed in v11.6 — it was cosmetic only, didn't save to DB,
            and could mislead customers into expecting a discount they didn't
            actually get. We'll bring it back when vouchers are a real table
            with server-side validation. */}

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
          <View style={s.divider} />
          <View style={s.sumRow}>
            <Text style={s.totalLbl}>Total</Text>
            <Text style={s.totalVal}>AED {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={placeOrder}
          style={[s.placeBtn, (items.length === 0 || placing) && { opacity: 0.6 }]}
          disabled={items.length === 0 || placing}
        >
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
  emptyCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 14,
    marginBottom: 10,
    borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,107,44,0.30)",
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  emptySub: { fontSize: 12, color: "#64748B", marginTop: 2 },
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
