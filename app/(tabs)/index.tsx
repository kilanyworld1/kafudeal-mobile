import { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { productsAPI, categoriesAPI } from "../../lib/api";
import type { Product, Category } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";
import { categories as STATIC_CATS } from "../../data/products";
import ProductCard from "../../components/ProductCard";

const PHRASES = [
  "Try 'chocolate'",
  "Try 'sourdough'",
  "Try 'milk 2L'",
  "Try 'iftar deals'",
  "Try 'strawberries'",
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user, customer } = useAuth();
  const [placeholder, setPlaceholder] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Typewriter loop
  useEffect(() => {
    let pi = 0, ci = 0, deleting = false;
    let timer: any;
    const tick = () => {
      const word = PHRASES[pi];
      if (!deleting) {
        ci++;
        setPlaceholder(word.slice(0, ci));
        if (ci === word.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
      } else {
        ci--;
        setPlaceholder(word.slice(0, ci));
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % PHRASES.length;
        }
      }
      timer = setTimeout(tick, deleting ? 35 : 75);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // Fetch live data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        productsAPI.getProducts({ from: 0, to: 60, excludeExpired: true }),
        categoriesAPI.getCategories(),
      ]);
      setProducts(prods);
      setLiveCategories(cats);
      setLoading(false);
    })();
  }, []);

  // Curate sections from live data
  const sections = useMemo(() => {
    const endingSoon = [...products]
      .filter((p) => p.urgent)
      .slice(0, 12);
    const topDeals = [...products]
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 12);
    const freshAndBakery = products.filter(
      (p) => p.category === "Fresh" || p.category === "Bakery"
    ).slice(0, 12);
    const beautyAndSnacks = products.filter(
      (p) => p.category === "Beauty" || p.category === "Snacks"
    ).slice(0, 12);
    return { endingSoon, topDeals, freshAndBakery, beautyAndSnacks };
  }, [products]);

  // Merge live categories with static icon metadata
  const displayCategories = useMemo(() => {
    if (liveCategories.length === 0) return STATIC_CATS;
    return liveCategories.slice(0, 7).map((c) => {
      const match = STATIC_CATS.find((s) => s.label.toLowerCase() === c.name.toLowerCase());
      return {
        key: c.id,
        label: c.name,
        emoji: c.icon || match?.emoji || "🛒",
        tint: match?.tint || "#FFE7D1",
        tag: match?.tag,
        hot: match?.hot,
      };
    });
  }, [liveCategories]);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={{ paddingBottom: 30 }}
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
            <Pressable onPress={() => router.push("/saved")} style={s.iconBtn}>
              <Ionicons name="heart-outline" size={18} color="white" />
            </Pressable>
            <Pressable onPress={() => router.push("/notifications")} style={s.iconBtn}>
              <Ionicons name="notifications-outline" size={18} color="white" />
              <View style={s.iconDot} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <Pressable onPress={() => router.push("/search")} style={s.search}>
          <Ionicons name="search" size={20} color="#334155" />
          <Text style={s.searchPlaceholder}>
            {placeholder}
            <Text style={s.cursor}>|</Text>
          </Text>
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
        {displayCategories.map((c) => (
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

      {/* Sign-in pill (only if not logged in) */}
      {!user && (
        <Pressable onPress={() => router.push("/login")} style={s.signinCard}>
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
      )}

      {user && customer && (
        <View style={s.welcomeBack}>
          <Text style={s.welcomeBackText}>
            Welcome back, {customer.fullName?.split(" ")[0] || "friend"} 👋
          </Text>
        </View>
      )}

      {loading ? (
        <View style={s.loadingBlock}>
          <ActivityIndicator color="#FF6B2C" size="large" />
          <Text style={s.loadingText}>Finding fresh deals…</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={s.loadingBlock}>
          <Ionicons name="cloud-offline-outline" size={42} color="#94A3B8" />
          <Text style={s.loadingText}>No deals available right now</Text>
          <Text style={s.loadingSub}>Pull to refresh or check back later</Text>
        </View>
      ) : (
        <>
          <Section
            title="Ending soon 🔥"
            sub="Grab these before they're gone"
            onSeeAll={() => router.push("/(tabs)/deals")}
          />
          <HScroll items={sections.endingSoon.length ? sections.endingSoon : products.slice(0, 8)} />

          <Section
            title="Top deals near you"
            sub="Biggest discounts today"
            onSeeAll={() => router.push("/(tabs)/deals")}
          />
          <HScroll items={sections.topDeals} />

          <View style={s.proBanner}>
            <View style={{ flex: 1 }}>
              <Text style={s.proBannerTitle}>KafuDeal Pro</Text>
              <Text style={s.proBannerSub}>Free delivery + early access to drops</Text>
              <Text style={s.proBannerCta}>Try free for 30 days →</Text>
            </View>
            <View style={s.proBannerIcon}>
              <Ionicons name="star" size={24} color="white" />
            </View>
          </View>

          {sections.freshAndBakery.length > 0 && (
            <>
              <Section
                title="Fresh & Bakery 🥖"
                sub="Today's best from our partners"
                onSeeAll={() => router.push("/(tabs)/deals")}
              />
              <HScroll items={sections.freshAndBakery} />
            </>
          )}

          {sections.beautyAndSnacks.length > 0 && (
            <>
              <Section
                title="Beauty & Snacks"
                sub="Treats worth saving"
                onSeeAll={() => router.push("/(tabs)/deals")}
              />
              <HScroll items={sections.beautyAndSnacks} />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Section({ title, sub, onSeeAll }: { title: string; sub?: string; onSeeAll?: () => void }) {
  return (
    <View style={s.sectionHead}>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {sub && <Text style={s.sectionSub}>{sub}</Text>}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={s.seeAll}>See all →</Text>
        </Pressable>
      )}
    </View>
  );
}

function HScroll({ items }: { items: Product[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
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
  cursor: { color: "#FF6B2C", fontWeight: "800" },
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
  welcomeBack: { paddingHorizontal: 20, marginTop: 14 },
  welcomeBackText: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  loadingBlock: { padding: 60, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14, color: "#64748B", marginTop: 14, fontWeight: "600" },
  loadingSub: { fontSize: 12, color: "#94A3B8", marginTop: 6 },
  sectionHead: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  sectionSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  seeAll: { color: "#FF6B2C", fontSize: 13, fontWeight: "800" },
  proBanner: {
    marginHorizontal: 16, marginTop: 24,
    backgroundColor: "#0F172A", borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 16,
  },
  proBannerTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  proBannerSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 3 },
  proBannerCta: { color: "#FFC857", fontSize: 13, fontWeight: "800", marginTop: 8 },
  proBannerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#FF6B2C",
    alignItems: "center", justifyContent: "center",
  },
});
