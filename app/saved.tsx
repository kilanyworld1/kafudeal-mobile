import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { productsAPI } from "../lib/api";
import { transformProduct } from "../lib/transformers";
import type { Product } from "../lib/types";
import { useCart } from "../lib/cart-context";
import ProductCard from "../components/ProductCard";

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { saved } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const { data } = await productsAPI.getProducts({ from: 0, to: 200 });
    setAllProducts((data || []).map(transformProduct));
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

  const items = useMemo(
    () => allProducts.filter((p) => saved.includes(p.id)),
    [allProducts, saved]
  );

  const urgentCount = items.filter((p) => p.urgent).length;

  // Back chevron mirrors visually in RTL so it points the reading direction
  const backIconStyle = I18nManager.isRTL
    ? { transform: [{ scaleX: -1 }] as any }
    : undefined;

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" style={backIconStyle} />
        </Pressable>
        <Text style={s.topTitle}>{t("saved.title")}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.empty}>
          <ActivityIndicator color="#FF6B2C" size="large" />
          <Text style={s.emptySub}>{t("common.loading")}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 56 }}>💝</Text>
          <Text style={s.emptyTitle}>{t("saved.empty")}</Text>
          <Text style={s.emptySub}>{t("saved.empty_sub")}</Text>
          <Pressable onPress={() => router.push("/(tabs)/deals")} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>{t("cart.browse_deals")}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B2C" />
          }
        >
          <Text style={s.subtitle}>
            {items.length === 1
              ? t("saved.item_count_one")
              : t("saved.items_count", { count: items.length })}
            {urgentCount > 0 ? ` · ${t("saved.ending_soon_count", { count: urgentCount })}` : ""}
          </Text>

          <View style={s.grid}>
            {items.map((p) => (
              <View key={p.id} style={{ width: "47.5%" }}>
                <ProductCard product={p} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  iconBtn: { padding: 6 },
  topTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: "center", lineHeight: 19 },
  emptyBtn: {
    backgroundColor: "#FF6B2C", paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginTop: 24,
  },
  emptyBtnText: { color: "white", fontSize: 14, fontWeight: "800" },
  subtitle: { fontSize: 13, color: "#64748B", marginBottom: 14, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
});
