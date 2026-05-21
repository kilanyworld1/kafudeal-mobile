import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { products, categories } from "../../data/products";

export default function Home() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Orange Banner */}
      <LinearGradient
        colors={["#FF6B2C", "#FF8C3A", "#FFA45E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[s.banner, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.topRow}>
          <Pressable style={{ flex: 1 }}>
            <Text style={s.eyebrow}>DELIVER TO</Text>
            <View style={s.locationRow}>
              <Ionicons name="location-sharp" size={14} color="white" />
              <Text style={s.locationText}>Dubai Marina · JLT</Text>
              <Ionicons name="chevron-down" size={14} color="white" style={{ marginLeft: 4, opacity: 0.7 }} />
            </View>
          </Pressable>

          <View style={s.actionsRow}>
            <Pressable style={s.iconBtn}>
              <Ionicons name="heart-outline" size={18} color="white" />
            </Pressable>
            <Pressable style={s.iconBtn}>
              <Ionicons name="notifications-outline" size={18} color="white" />
              <View style={s.iconDot} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <Pressable style={s.search}>
          <Ionicons name="search" size={20} color="#334155" />
          <Text style={s.searchPlaceholder}>Search snacks, brands, stores…</Text>
        </Pressable>

        {/* Trust strip */}
        <View style={s.trustRow}>
          {[
            { num: "−70%", lbl: "OFF GROCERIES" },
            { num: "2h", lbl: "AVG DELIVERY" },
            { num: "100%", lbl: "VERIFIED STORES" },
          ].map((t, i) => (
            <View key={i} style={s.trustItem}>
              <Text style={s.trustNum}>{t.num}</Text>
              <Text style={s.trustLbl}>{t.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        style={{ marginTop: -28 }}
      >
        {categories.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => router.push("/(tabs)/deals")}
            style={s.catWrap}
          >
            <View style={[s.catArt, { backgroundColor: c.tint }]}>
              <Text style={{ fontSize: 36 }}>{c.emoji}</Text>
              {c.tag && (
                <View style={[s.catTag, { backgroundColor: c.hot ? "#FF6B2C" : "#0F172A" }]}>
                  <Text style={s.catTagText}>{c.tag}</Text>
                </View>
              )}
            </View>
            <Text style={s.catName}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sign-in card */}
      <Pressable
        onPress={() => router.push("/(tabs)/account")}
        style={s.signinCard}
      >
        <View style={s.signinIcon}>
          <Ionicons name="person" size={22} color="#FF6B2C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.signinTitle}>Hey there! 👋</Text>
          <Text style={s.signinSub}>Sign in for personalised deals & order tracking</Text>
        </View>
        <View style={s.signinBtn}>
          <Text style={s.signinBtnText}>Sign in</Text>
        </View>
      </Pressable>

      {/* Top deals header */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Top deals near you 🔥</Text>
        <Pressable onPress={() => router.push("/(tabs)/deals")}>
          <Text style={s.seeAll}>See all →</Text>
        </Pressable>
      </View>

      {/* Product grid */}
      <View style={s.grid}>
        {products.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/product/${p.id}`)}
            style={s.card}
          >
            <View style={s.cardImg}>
              <Image source={{ uri: p.image }} style={{ width: "100%", height: "100%" }} />
              <View style={s.discBadge}>
                <Text style={s.discText}>-{p.discount}%</Text>
              </View>
              <Pressable style={s.favBadge}>
                <Ionicons name="heart-outline" size={16} color="#0F172A" />
              </Pressable>
            </View>
            <View style={{ paddingTop: 8, paddingHorizontal: 2 }}>
              <Text style={s.cardStore}>{p.store}</Text>
              <Text numberOfLines={1} style={s.cardName}>{p.name}</Text>
              <View style={s.priceRow}>
                <Text style={s.priceNow}>AED {p.price}</Text>
                <Text style={s.priceWas}>AED {p.was}</Text>
              </View>
              <View style={s.endsRow}>
                <Ionicons name="time-outline" size={11} color="#64748B" />
                <Text style={s.endsText}>{p.endsIn}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#FFF9F2" },
  banner: {
    paddingHorizontal: 20, paddingBottom: 60,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  eyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 10.5, fontWeight: "700", letterSpacing: 1.6 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: { color: "white", fontSize: 16, fontWeight: "800", marginLeft: 6, letterSpacing: -0.2 },
  actionsRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center", justifyContent: "center",
  },
  iconDot: {
    position: "absolute", top: 8, right: 9, width: 9, height: 9,
    borderRadius: 4.5, backgroundColor: "#FFC857",
    borderWidth: 2, borderColor: "#FF8C3A",
  },
  search: {
    marginTop: 18, backgroundColor: "white", borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 4,
  },
  searchPlaceholder: { flex: 1, color: "#64748B", fontSize: 14 },
  trustRow: {
    marginTop: 18, paddingHorizontal: 4,
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
  },
  trustItem: { flex: 1, alignItems: "center" },
  trustNum: { color: "white", fontSize: 17, fontWeight: "800" },
  trustLbl: {
    color: "rgba(255,255,255,0.85)", fontSize: 9.5, fontWeight: "700",
    letterSpacing: 0.6, marginTop: 2,
  },
  catWrap: { width: 80, alignItems: "center" },
  catArt: {
    width: 80, height: 80, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
  },
  catTag: {
    position: "absolute", bottom: 5, left: 5,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5,
  },
  catTagText: { color: "white", fontSize: 8.5, fontWeight: "800" },
  catName: { marginTop: 9, fontSize: 12.5, fontWeight: "700", color: "#0F172A" },
  signinCard: {
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: "white", borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  signinIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  signinTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  signinSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  signinBtn: {
    backgroundColor: "#FF6B2C",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  signinBtnText: { color: "white", fontSize: 12, fontWeight: "800" },
  sectionHead: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  seeAll: { color: "#FF6B2C", fontSize: 13, fontWeight: "700" },
  grid: { paddingHorizontal: 16, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47.5%" },
  cardImg: {
    aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#F1EFE8",
  },
  discBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#FF6B2C",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  discText: { color: "white", fontSize: 11, fontWeight: "800" },
  favBadge: {
    position: "absolute", top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center", justifyContent: "center",
  },
  cardStore: { fontSize: 9.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5 },
  cardName: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4, gap: 6 },
  priceNow: { color: "#FF6B2C", fontSize: 15, fontWeight: "800" },
  priceWas: { color: "#94A3B8", fontSize: 11, textDecorationLine: "line-through" },
  endsRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  endsText: { fontSize: 10.5, color: "#64748B", fontWeight: "600" },
});
