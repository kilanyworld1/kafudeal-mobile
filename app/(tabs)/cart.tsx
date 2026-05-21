import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { products } from "../../data/products";

export default function Cart() {
  const insets = useSafeAreaInsets();
  const cartItems = products.slice(0, 2);
  const subtotal = cartItems.reduce((a, p) => a + p.price, 0);
  const delivery = 15;
  const total = subtotal + delivery;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Your cart</Text>
        <Text style={s.subtitle}>{cartItems.length} items</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 200 }}>
        {cartItems.map((p) => (
          <View key={p.id} style={s.item}>
            <Image source={{ uri: p.image }} style={s.itemImg} />
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                <Text style={s.itemName}>{p.name}</Text>
                <Text style={s.itemStore}>{p.store}</Text>
              </View>
              <View style={s.itemRow}>
                <Text style={s.itemPrice}>AED {p.price}</Text>
                <View style={s.qty}>
                  <Pressable style={s.qtyBtn}><Ionicons name="remove" size={16} color="#0F172A" /></Pressable>
                  <Text style={s.qtyText}>1</Text>
                  <Pressable style={s.qtyBtn}><Ionicons name="add" size={16} color="#0F172A" /></Pressable>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={s.summary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Subtotal</Text>
            <Text style={s.summaryVal}>AED {subtotal.toFixed(2)}</Text>
          </View>
          <View style={[s.summaryRow, { marginTop: 8 }]}>
            <Text style={s.summaryLbl}>Delivery</Text>
            <Text style={s.summaryVal}>AED {delivery}.00</Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={s.totalLbl}>Total</Text>
            <Text style={s.totalVal}>AED {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.checkoutWrap}>
        <Pressable style={s.checkoutBtn}>
          <Text style={s.checkoutText}>Checkout · AED {total.toFixed(2)}</Text>
        </Pressable>
      </View>
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
  item: {
    flexDirection: "row", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 12,
    marginBottom: 10,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  itemImg: { width: 70, height: 70, borderRadius: 10 },
  itemName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  itemStore: { fontSize: 11, color: "#64748B", marginTop: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemPrice: { color: "#FF6B2C", fontSize: 15, fontWeight: "800" },
  qty: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F1EFE8", borderRadius: 999, paddingHorizontal: 4,
  },
  qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 14, fontWeight: "800", color: "#0F172A", minWidth: 18, textAlign: "center" },
  summary: { backgroundColor: "white", borderRadius: 14, padding: 16, marginTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLbl: { color: "#64748B", fontSize: 13 },
  summaryVal: { fontWeight: "700", color: "#0F172A" },
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
