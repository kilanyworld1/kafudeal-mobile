import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { productsAPI, categoriesAPI } from "../../lib/api";
import { transformProduct, transformCategory } from "../../lib/transformers";
import type { Product, Category } from "../../lib/types";
import ProductCard from "../../components/ProductCard";

export default function Deals() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: prods }, { data: c }] = await Promise.all([
      productsAPI.getProducts({ from: 0, to: 200, excludeExpired: true }),
      categoriesAPI.getCategories(),
    ]);
    setProducts((prods || []).map(transformProduct));
    setCats((c || []).map(transformCategory));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();
  }, [fetchAll]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const filters = useMemo(() => {
    const dynamicCats = cats.slice(0, 6).map((c) => c.name);
    return ["All", "Ending soon", ...dynamicCats];
  }, [cats]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter === "All") return true;
      if (filter === "Ending soon") return p.urgent;
      return p.category === filter;
    });
  }, [products, filter]);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Deals</Text>
        <Text style={s.subtitle}>
          {products.length} deals near you · ending soon
        </Text>

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
          {filters.map((f) => (
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

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color="#FF6B2C" size="large" />
          <Text style={s.loadingText}>Loading deals…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B2C" />
          }
        >
          <Text style={s.resultsCount}>{filtered.length} results</Text>
          <View style={s.grid}>
            {filtered.map((p) => (
              <View key={p.id} style={{ width: "47.5%" }}>
                <ProductCard product={p} />
              </View>
            ))}
          </View>
          {filtered.length === 0 && (
            <Text style={s.empty}>No deals match this filter</Text>
          )}
        </ScrollView>
      )}
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
  loading: { padding: 60, alignItems: "center" },
  loadingText: { fontSize: 13, color: "#64748B", marginTop: 14 },
  resultsCount: { fontSize: 13, color: "#64748B", marginBottom: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40, fontSize: 13 },
});
