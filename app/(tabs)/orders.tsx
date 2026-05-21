import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const orders = [
  { id: "280146FC", status: "On the way", date: "Today · 14:30", total: 18, items: 2, color: "#1D4ED8" },
  { id: "21623AAA", status: "Delivered", date: "Yesterday", total: 16, items: 1, color: "#166534" },
  { id: "F2D986DA", status: "Delivered", date: "5 May 2026", total: 17, items: 1, color: "#166534" },
];

export default function Orders() {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Your orders</Text>
        <Text style={s.subtitle}>{orders.length} orders</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {orders.map((o) => (
          <Pressable key={o.id} style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.cardId}>#{o.id}</Text>
              <View style={[s.statusPill, { backgroundColor: o.color + "20" }]}>
                <Text style={[s.statusText, { color: o.color }]}>{o.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.cardMeta}>
              {o.items} {o.items === 1 ? "item" : "items"} · {o.date}
            </Text>
            <View style={s.divider} />
            <View style={s.cardBottom}>
              <Text style={s.cardTotal}>AED {o.total}</Text>
              <View style={s.trackRow}>
                <Text style={s.trackText}>Track</Text>
                <Ionicons name="chevron-forward" size={14} color="#FF6B2C" />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
  card: {
    backgroundColor: "white", borderRadius: 14, padding: 16,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardId: { fontFamily: "Menlo", fontSize: 13, fontWeight: "800", color: "#0F172A" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  cardMeta: { color: "#64748B", fontSize: 12, marginTop: 6 },
  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)", marginVertical: 12 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTotal: { color: "#FF6B2C", fontSize: 17, fontWeight: "800" },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trackText: { color: "#FF6B2C", fontSize: 13, fontWeight: "700" },
});
