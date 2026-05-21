import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { products } from "../../data/products";

const filters = ["All", "Snacks", "Fresh", "Bakery", "Dairy", "Beauty", "Drinks"];

export default function Deals() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Deals</Text>
        <Text style={s.subtitle}>{products.length} deals near you · ending soon</Text>

        <Pressable style={s.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <Text style={s.searchText}>Search…</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12, marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {filters.map((f, i) => (
            <Pressable key={f} style={[s.chip, i === 0 && s.chipActive]}>
              <Text style={[s.chipText, i === 0 && s.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}>
        {products.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} style={s.row}>
            <Image source={{ uri: p.image }} style={s.rowImg} />
            <View style={s.rowInfo}>
              <View>
                <Text style={s.rowStore}>{p.store}</Text>
                <Text style={s.rowName}>{p.name}</Text>
              </View>
              <View>
                <View style={s.rowPrices}>
                  <Text style={s.rowNow}>AED {p.price}</Text>
                  <Text style={s.rowWas}>AED {p.was}</Text>
                  <View style={s.savePill}>
                    <Text style={s.savePillText}>-{p.discount}%</Text>
                  </View>
                </View>
                <View style={s.rowEnds}>
                  <Ionicons name="time-outline" size={11} color="#64748B" />
                  <Text style={s.rowEndsText}>{p.endsIn}</Text>
                </View>
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
  searchBar: {
    marginTop: 14, backgroundColor: "#F1EFE8", borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  searchText: { color: "#64748B", fontSize: 14 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: "#F1EFE8",
  },
  chipActive: { backgroundColor: "#0F172A" },
  chipText: { color: "#334155", fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "white" },
  row: {
    backgroundColor: "white", borderRadius: 14, overflow: "hidden",
    flexDirection: "row", gap: 12, padding: 10,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  rowImg: { width: 90, height: 90, borderRadius: 10 },
  rowInfo: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  rowStore: { fontSize: 9.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5 },
  rowName: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 3 },
  rowPrices: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  rowNow: { color: "#FF6B2C", fontSize: 16, fontWeight: "800" },
  rowWas: { color: "#94A3B8", fontSize: 12, textDecorationLine: "line-through" },
  savePill: {
    backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginLeft: 4,
  },
  savePillText: { color: "#166534", fontSize: 10, fontWeight: "800" },
  rowEnds: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  rowEndsText: { fontSize: 11, color: "#64748B", fontWeight: "600" },
});
