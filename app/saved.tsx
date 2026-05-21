import { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { products } from "../data/products";

export default function Saved() {
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(products.slice(0, 4).map((p) => p.id));

  const items = products.filter((p) => saved.includes(p.id));

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Saved deals</Text>
        <View style={{ width: 36 }} />
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="heart-outline" size={64} color="#CBD5E1" />
          <Text style={s.emptyTitle}>No saved deals yet</Text>
          <Text style={s.emptySub}>Tap the heart on any product to save it for later</Text>
          <Pressable onPress={() => router.push("/(tabs)/deals")} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Browse deals</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          <Text style={s.subtitle}>{items.length} items saved</Text>
          <View style={s.grid}>
            {items.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/product/${p.id}`)}
                style={s.card}
              >
                <View style={s.imgWrap}>
                  <Image source={{ uri: p.image }} style={{ width: "100%", height: "100%" }} />
                  <View style={s.discBadge}>
                    <Text style={s.discText}>-{p.discount}%</Text>
                  </View>
                  <Pressable
                    onPress={() => setSaved(saved.filter((id) => id !== p.id))}
                    style={s.favBadge}
                  >
                    <Ionicons name="heart" size={18} color="#FF6B2C" />
                  </Pressable>
                </View>
                <Text style={s.cardStore}>{p.store}</Text>
                <Text style={s.cardName} numberOfLines={1}>{p.name}</Text>
                <View style={s.priceRow}>
                  <Text style={s.priceNow}>AED {p.price}</Text>
                  <Text style={s.priceWas}>AED {p.was}</Text>
                </View>
                <View style={s.endsRow}>
                  <Ionicons name="time-outline" size={11} color="#64748B" />
                  <Text style={s.endsText}>{p.endsIn}</Text>
                </View>
              </Pressable>
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
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 18 },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: "center" },
  emptyBtn: {
    backgroundColor: "#FF6B2C", paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginTop: 24,
  },
  emptyBtnText: { color: "white", fontSize: 14, fontWeight: "800" },
  subtitle: { fontSize: 13, color: "#64748B", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47.5%" },
  imgWrap: { aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#F1EFE8" },
  discBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#FF6B2C", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  discText: { color: "white", fontSize: 11, fontWeight: "800" },
  favBadge: {
    position: "absolute", top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center", justifyContent: "center",
  },
  cardStore: { fontSize: 9.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5, marginTop: 8 },
  cardName: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4, gap: 6 },
  priceNow: { color: "#FF6B2C", fontSize: 15, fontWeight: "800" },
  priceWas: { color: "#94A3B8", fontSize: 11, textDecorationLine: "line-through" },
  endsRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  endsText: { fontSize: 10.5, color: "#64748B", fontWeight: "600" },
});
