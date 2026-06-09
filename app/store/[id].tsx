import { View, Text, ScrollView, Pressable, Image, StyleSheet, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { products } from "../../data/products";

const STORES: Record<string, { name: string; tagline: string; cover: string; rating: number; reviews: number; eta: string; minOrder: number; }> = {
  "1": {
    name: "Carrefour Marina",
    tagline: "Verified store · Marina Mall",
    cover: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80",
    rating: 4.8, reviews: 1240, eta: "25–35 min", minOrder: 20,
  },
  "default": {
    name: "Verified Store",
    tagline: "Verified store · Dubai",
    cover: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80",
    rating: 4.7, reviews: 980, eta: "25–35 min", minOrder: 20,
  },
};

export default function StorePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const store = STORES[id || "default"] || STORES["default"];
  const items = products;

  // Categories now come from JSON so they show in Arabic when the app
  // is in Arabic. Order matches the previous hardcoded English list.
  const categoryChips = [
    { key: "all", label: t("category.all") },
    { key: "top_deals", label: t("category.top_deals") },
    { key: "snacks", label: t("category.snacks") },
    { key: "dairy", label: t("category.dairy") },
    { key: "fresh", label: t("category.fresh") },
    { key: "bakery", label: t("category.bakery") },
    { key: "beauty", label: t("category.beauty") },
  ];

  const backIconStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] as any } : undefined;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Cover */}
        <View style={s.cover}>
          <Image source={{ uri: store.cover }} style={{ width: "100%", height: "100%" }} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)"]}
            style={s.coverFade}
          />
          <View style={[s.topBar, { top: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={s.iconBtn}>
              <Ionicons name="chevron-back" size={22} color="#0F172A" style={backIconStyle} />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable style={s.iconBtn}>
                <Ionicons name="share-outline" size={20} color="#0F172A" />
              </Pressable>
              <Pressable style={s.iconBtn}>
                <Ionicons name="heart-outline" size={20} color="#0F172A" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Header card */}
        <View style={s.headerCard}>
          <View style={s.logoWrap}>
            <Ionicons name="storefront" size={28} color="#FF6B2C" />
          </View>
          <Text style={s.name}>{store.name}</Text>
          <Text style={s.tagline}>{store.tagline}</Text>

          <View style={s.statsRow}>
            <View style={s.stat}>
              <View style={s.starRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={s.statNum}>{store.rating}</Text>
              </View>
              <Text style={s.statLbl}>{store.reviews.toLocaleString()} {t("home.trust_verified_stores").toLowerCase().includes("متاجر") ? "تقييم" : "reviews"}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>{store.eta}</Text>
              <Text style={s.statLbl}>{t("checkout.delivery_label")}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>AED {store.minOrder}</Text>
              <Text style={s.statLbl}>{t("toast.min_order", { amount: "" }).replace("AED ", "").replace(/\s+$/, "")}</Text>
            </View>
          </View>

          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
              <Text style={s.badgeText}>{t("home.trust_verified_stores")}</Text>
            </View>
            <View style={s.badge}>
              <Ionicons name="leaf" size={12} color="#16A34A" />
              <Text style={s.badgeText}>HALAL</Text>
            </View>
            <View style={s.badge}>
              <Ionicons name="flash" size={12} color="#FF6B2C" />
              <Text style={s.badgeText}>{t("checkout.express_2h").split(" ")[0].toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          style={{ marginTop: 18 }}
        >
          {categoryChips.map((c, i) => (
            <Pressable key={c.key} style={[s.chip, i === 0 && s.chipActive]}>
              <Text style={[s.chipText, i === 0 && s.chipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Products */}
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
              </View>
              <Text style={s.cardName} numberOfLines={1}>{p.name}</Text>
              <View style={s.priceRow}>
                <Text style={s.priceNow}>AED {p.price}</Text>
                <Text style={s.priceWas}>AED {p.was}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  cover: { height: 200, backgroundColor: "#F1EFE8" },
  coverFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 80 },
  topBar: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between",
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "white",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6,
  },
  headerCard: {
    marginHorizontal: 16, marginTop: -40,
    backgroundColor: "white", borderRadius: 18, padding: 18,
    alignItems: "center",
    shadowColor: "#0F172A", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 14,
  },
  logoWrap: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 10, letterSpacing: -0.3 },
  tagline: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 16, alignSelf: "stretch" },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  statLbl: { fontSize: 10.5, color: "#64748B", marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(15,23,42,0.10)" },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 14 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "#F1EFE8",
  },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#0F172A", letterSpacing: 0.3 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "white", borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
  },
  chipActive: { backgroundColor: "#FF6B2C", borderColor: "#FF6B2C" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
  chipTextActive: { color: "white" },
  grid: {
    paddingHorizontal: 16, marginTop: 16,
    flexDirection: "row", flexWrap: "wrap", gap: 12,
  },
  card: { width: "47.5%" },
  imgWrap: {
    aspectRatio: 1, borderRadius: 12, overflow: "hidden",
    backgroundColor: "#F1EFE8",
  },
  discBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "#FF6B2C", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5,
  },
  discText: { color: "white", fontSize: 10.5, fontWeight: "800" },
  cardName: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4, gap: 6 },
  priceNow: { color: "#FF6B2C", fontSize: 14, fontWeight: "800" },
  priceWas: { color: "#94A3B8", fontSize: 11, textDecorationLine: "line-through" },
});
