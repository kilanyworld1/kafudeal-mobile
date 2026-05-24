import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
  Animated, Image, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { productsAPI, categoriesAPI } from "../../lib/api";
import { transformProduct, transformCategory } from "../../lib/transformers";
import type { Product, Category } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";
import { useNotifications } from "../../lib/notifications-context";
import { categories as STATIC_CATS } from "../../data/products";
import ProductCard from "../../components/ProductCard";
import HeaderIconButton from "../../components/HeaderIconButton";

const PHRASES = [
  "Try 'chocolate'",
  "Try 'sourdough'",
  "Try 'milk 2L'",
  "Try 'iftar deals'",
  "Try 'strawberries'",
];

const ALL = "All";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user, customer } = useAuth();
  const { unreadCount } = useNotifications();
  const [placeholder, setPlaceholder] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>(ALL);

  // Sticky header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const STICKY_THRESHOLD = 220;

  // Typewriter
  useEffect(() => {
    let pi = 0, ci = 0, deleting = false;
    let timer: any;
    const tick = () => {
      const word = PHRASES[pi];
      if (!deleting) {
        ci++;
        setPlaceholder(word.slice(0, ci));
        if (ci === word.length) { deleting = true; timer = setTimeout(tick, 1600); return; }
      } else {
        ci--;
        setPlaceholder(word.slice(0, ci));
        if (ci === 0) { deleting = false; pi = (pi + 1) % PHRASES.length; }
      }
      timer = setTimeout(tick, deleting ? 35 : 75);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      productsAPI.getProducts({ from: 0, to: 60, excludeExpired: true }),
      categoriesAPI.getCategories(),
    ]);
    setProducts((prods || []).map(transformProduct));
    setLiveCategories((cats || []).map(transformCategory));
  }, []);

  // Initial fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();
  }, [fetchAll]);

  // Refetch on focus but throttled — skip if we fetched < 10s ago
  const lastFetchRef = useRef(0);
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchRef.current > 10000) {
        fetchAll().then(() => { lastFetchRef.current = Date.now(); });
      }
    }, [fetchAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Filter by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCat === ALL) return products;
    return products.filter((p) => p.category.toLowerCase() === selectedCat.toLowerCase());
  }, [products, selectedCat]);

  const sections = useMemo(() => {
    const list = filteredProducts;
    const endingSoon = list.filter((p) => p.urgent).slice(0, 12);
    const topDeals = [...list].sort((a, b) => b.discount - a.discount).slice(0, 12);
    return { endingSoon, topDeals };
  }, [filteredProducts]);

  // All categories from DB (no slice — show everything the admin has added)
  const displayCategories = useMemo(() => {
    const arr = [{ key: ALL, label: ALL, emoji: "✨", tint: "#FFF1E5" } as any];
    if (liveCategories.length > 0) {
      liveCategories.forEach((c) => {
        const match = STATIC_CATS.find((sc) => sc.label.toLowerCase() === c.name.toLowerCase());
        arr.push({
          key: c.name,
          label: c.name,
          emoji: c.icon || match?.emoji || "🛒",
          tint: match?.tint || "#FFE7D1",
        });
      });
    } else {
      STATIC_CATS.forEach((c) => arr.push({ key: c.label, label: c.label, emoji: c.emoji, tint: c.tint }));
    }
    return arr;
  }, [liveCategories]);

  // Group products by category — for the dynamic per-category sections in the body
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const cat = p.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [products]);

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    "";

  // Sticky header interpolations
  const stickyOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD - 40, STICKY_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const stickyTranslate = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD - 40, STICKY_THRESHOLD],
    outputRange: [-50, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={s.root}>
      {/* Sticky mini-header (appears on scroll) */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          s.stickyHeader,
          {
            paddingTop: insets.top + 6,
            opacity: stickyOpacity,
            transform: [{ translateY: stickyTranslate }],
          },
        ]}
      >
        <View style={s.stickyTopRow}>
          <Pressable onPress={() => router.push("/addresses")} style={s.stickyLoc} hitSlop={8}>
            <Ionicons name="location-sharp" size={14} color="#FF6B2C" />
            <Text style={s.stickyLocText}>Dubai Marina · JLT</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <HeaderIconButton
              icon="heart-outline"
              onPress={() => router.push("/saved")}
              variant="solid"
              size={36}
              iconSize={18}
              color="#0F172A"
            />
            <HeaderIconButton
              icon="notifications-outline"
              onPress={() => router.push("/notifications")}
              variant="solid"
              size={36}
              iconSize={18}
              color="#0F172A"
              showDot={unreadCount}
            />
          </View>
        </View>

        {/* Tiny inline category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 6 }}
        >
          {displayCategories.map((c) => {
            const active = selectedCat === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setSelectedCat(c.key)}
                style={[s.miniChip, active && s.miniChipActive]}
              >
                <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                <Text style={[s.miniChipText, active && s.miniChipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B2C" />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Orange Banner */}
        <LinearGradient
          colors={["#FF6B2C", "#FF8C3A", "#FFA45E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={[s.banner, { paddingTop: insets.top + 16 }]}
        >
          <View style={s.topRow}>
            <Pressable
              onPress={() => router.push("/addresses")}
              style={s.addressBtn}
              hitSlop={6}
            >
              <Text style={s.eyebrow}>DELIVER TO</Text>
              <View style={s.locationRow}>
                <Ionicons name="location-sharp" size={14} color="white" />
                <Text style={s.locationText}>Dubai Marina · JLT</Text>
                <Ionicons name="chevron-down" size={14} color="white" style={{ marginLeft: 4, opacity: 0.7 }} />
              </View>
            </Pressable>

            <View style={s.actionsRow}>
              <HeaderIconButton
                icon="heart-outline"
                onPress={() => router.push("/saved")}
                variant="translucent"
                size={44}
                iconSize={22}
              />
              <HeaderIconButton
                icon="notifications-outline"
                onPress={() => router.push("/notifications")}
                variant="translucent"
                size={44}
                iconSize={22}
                showDot={unreadCount}
              />
            </View>
          </View>

          <Pressable onPress={() => router.push("/search")} style={s.search}>
            <Ionicons name="search" size={20} color="#334155" />
            <Text style={s.searchPlaceholder}>
              {placeholder}
              <Text style={s.cursor}>|</Text>
            </Text>
          </Pressable>

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

        {/* Category chips (big) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          style={{ marginTop: -28 }}
        >
          {displayCategories.map((c) => {
            const active = selectedCat === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setSelectedCat(c.key)}
                style={s.catWrap}
              >
                <View style={[
                  s.catArt,
                  { backgroundColor: c.tint },
                  active && s.catArtActive,
                ]}>
                  <Text style={{ fontSize: 36 }}>{c.emoji}</Text>
                </View>
                <Text style={[s.catName, active && { color: "#FF6B2C" }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sign-in pill */}
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
        ) : filteredProducts.length === 0 ? (
          <View style={s.loadingBlock}>
            <Text style={{ fontSize: 56 }}>🧐</Text>
            <Text style={s.loadingText}>
              {selectedCat === ALL ? "No deals available right now" : `No ${selectedCat} deals right now`}
            </Text>
            {selectedCat !== ALL && (
              <Pressable onPress={() => setSelectedCat(ALL)} style={s.loadingResetBtn}>
                <Text style={s.loadingResetText}>Show all deals</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            {sections.endingSoon.length > 0 && (
              <>
                <Section
                  title={selectedCat === ALL ? "Ending soon 🔥" : `${selectedCat} · Ending soon 🔥`}
                  sub="Grab these before they're gone"
                  onSeeAll={() => router.push("/(tabs)/deals")}
                />
                <HScroll items={sections.endingSoon} />
              </>
            )}

            <Section
              title={selectedCat === ALL ? "Top deals near you" : `${selectedCat} · Top deals`}
              sub="Biggest discounts today"
              onSeeAll={() => router.push("/(tabs)/deals")}
            />
            <HScroll items={sections.topDeals.length ? sections.topDeals : filteredProducts.slice(0, 12)} />

            {selectedCat === ALL && (
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
            )}

            {/* When viewing ALL, render one section per category (web parity) */}
            {selectedCat === ALL &&
              Array.from(productsByCategory.entries()).map(([catName, list]) => {
                if (list.length === 0) return null;
                const meta = displayCategories.find((c) => c.label === catName);
                const emoji = meta?.emoji || "🛒";
                return (
                  <View key={catName}>
                    <Section
                      title={`${catName} ${emoji}`}
                      sub={`${list.length} item${list.length === 1 ? "" : "s"}`}
                      onSeeAll={() => {
                        setSelectedCat(catName);
                      }}
                    />
                    <HScroll items={list.slice(0, 12)} />
                  </View>
                );
              })}

            <Section
              title={selectedCat === ALL ? "All deals" : `All ${selectedCat}`}
              sub={`${filteredProducts.length} items`}
              onSeeAll={() => router.push("/(tabs)/deals")}
            />
            <HScroll items={filteredProducts} />
          </>
        )}
      </Animated.ScrollView>
    </View>
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
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  scroll: { flex: 1 },
  stickyHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: "white",
    shadowColor: "#0F172A", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
    elevation: 8,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
  stickyTopRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4,
  },
  stickyLoc: { flexDirection: "row", alignItems: "center", gap: 5 },
  stickyLocText: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  stickyIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F1EFE8",
    alignItems: "center", justifyContent: "center",
  },
  stickyDot: {
    position: "absolute", top: 6, right: 7, width: 8, height: 8,
    borderRadius: 4, backgroundColor: "#FF6B2C",
    borderWidth: 2, borderColor: "white",
  },
  stickyAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1EFE8" },
  miniChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "#F1EFE8",
  },
  miniChipActive: { backgroundColor: "#0F172A" },
  miniChipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  miniChipTextActive: { color: "white" },

  banner: {
    paddingHorizontal: 20, paddingBottom: 60,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  // Limit the address Pressable to its own content so it can't steal taps from the icons to its right.
  addressBtn: { alignSelf: "flex-start" },
  eyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 10.5, fontWeight: "700", letterSpacing: 1.6 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: { color: "white", fontSize: 16, fontWeight: "800", marginLeft: 6, letterSpacing: -0.2 },
  actionsRow: {
    flexDirection: "row", gap: 10, alignItems: "center",
    marginLeft: "auto",
    zIndex: 30, elevation: 30,
  },
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
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
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
    borderWidth: 2, borderColor: "transparent",
  },
  catArtActive: { borderColor: "#FF6B2C" },
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
  loadingText: { fontSize: 14, color: "#64748B", marginTop: 14, fontWeight: "600", textAlign: "center" },
  loadingResetBtn: {
    backgroundColor: "#FF6B2C", paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 10, marginTop: 18,
  },
  loadingResetText: { color: "white", fontSize: 13, fontWeight: "800" },
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
