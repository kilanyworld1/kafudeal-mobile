import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { products } from "../../data/products";
import ProductCard from "../../components/ProductCard";

const FILTERS = ["All", "Ending soon", "Snacks", "Fresh", "Bakery", "Dairy", "Beauty"];

export default function Deals() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");

  const filtered = products.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Ending soon") return p.urgent;
    return p.category === filter;
  });

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Deals</Text>
        <Text style={s.subtitle}>{products.length} deals near you · ending soon</Text>

        <Pressable onPress={() => router.push("/search")} style={s.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <Text style={s.searchText}>Search snacks, brands, stores…</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12, marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[s.chip, filter === f && s.chipActive]}
            >
              <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={s.resultsCount}>{filtered.length} results</Text>
        <View style={s.grid}>
          {filtered.map((p) => (
            <View key={p.id} style={{ width: "47.5%" }}>
              <ProductCard product={p} />
            </View>
          ))}
        </View>
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
  resultsCount: { fontSize: 13, color: "#64748B", marginBottom: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
});
