import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { productsAPI } from "../../lib/api";
import { transformProduct } from "../../lib/transformers";
import type { Product } from "../../lib/types";
import { useCart } from "../../lib/cart-context";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { add, toggleSaved, isSaved } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await productsAPI.getProduct(String(id));
      setProduct(data ? transformProduct(data) : null);
      setLoading(false);
    })();
  }, [id]);

  const saved = product ? isSaved(product.id) : false;

  const pressHeart = () => {
    if (!product) return;
    toggleSaved(product.id, product.name);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 140, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const pressAdd = () => {
    if (!product) return;
    add(product);
    Animated.sequence([
      Animated.timing(addScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.spring(addScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color="#FF6B2C" size="large" />
        <Text style={{ color: "#64748B", marginTop: 14 }}>Loading…</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={s.loading}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={{ color: "#0F172A", fontSize: 16, marginTop: 12, fontWeight: "800" }}>
          Product not found
        </Text>
        <Pressable onPress={() => router.back()} style={s.backCta}>
          <Text style={s.backCtaText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.hero}>
          <Image source={{ uri: product.image }} style={{ width: "100%", height: "100%" }} />

          <View style={[s.topBar, { top: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={s.topBtn}>
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
            </Pressable>
            <Pressable onPress={pressHeart} style={s.topBtn}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={saved ? "heart" : "heart-outline"}
                  size={20}
                  color={saved ? "#DC2626" : "#0F172A"}
                />
              </Animated.View>
            </Pressable>
          </View>

          <View style={[s.heroBadge, { top: insets.top + 60 }]}>
            <Text style={s.heroBadgeText}>-{product.discountPercentage}% OFF</Text>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={s.store}>{product.store}</Text>
          <Text style={s.name}>{product.name}</Text>

          <View style={s.priceRow}>
            <Text style={s.priceNow}>AED {product.discountedPrice}</Text>
            <Text style={s.priceWas}>AED {product.originalPrice}</Text>
            <View style={s.savePill}>
              <Text style={s.savePillText}>
                Save AED {Math.max(0, product.originalPrice - product.discountedPrice).toFixed(0)}
              </Text>
            </View>
          </View>

          <View style={s.urgency}>
            <Ionicons name="time" size={16} color="#FF6B2C" />
            <Text style={s.urgencyText}>
              {product.endsIn} {product.stock > 0 ? `· ${product.stock} left in stock` : ""}
            </Text>
          </View>

          {product.description ? (
            <>
              <Text style={s.sectionLabel}>About this product</Text>
              <Text style={s.description}>{product.description}</Text>
            </>
          ) : (
            <>
              <Text style={s.sectionLabel}>About this product</Text>
              <Text style={s.description}>
                Stocked daily by our verified store partners. This product is near its best-before
                date — perfectly safe to consume but priced to move so it doesn't go to waste.
                Every listing is checked by KafuDeal before going live.
              </Text>
            </>
          )}

          <View style={s.trustRow}>
            <View style={s.trustBox}>
              <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
              <Text style={s.trustLbl}>VERIFIED</Text>
            </View>
            <View style={s.trustBox}>
              <Ionicons name="leaf-outline" size={20} color="#16A34A" />
              <Text style={s.trustLbl}>HALAL</Text>
            </View>
            <View style={s.trustBox}>
              <Ionicons name="time-outline" size={20} color="#1D4ED8" />
              <Text style={s.trustLbl}>2H DELIVERY</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.bottomRow}>
          <Pressable onPress={pressHeart} style={s.heartBtn}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={22}
                color={saved ? "#DC2626" : "#0F172A"}
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={pressAdd} style={{ flex: 1 }}>
            <Animated.View style={[s.addBtn, { transform: [{ scale: addScale }] }]}>
              <Ionicons name="cart" size={20} color="white" />
              <Text style={s.addBtnText}>Add to cart · AED {product.discountedPrice}</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  loading: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFF9F2", padding: 40,
  },
  backCta: {
    marginTop: 18, backgroundColor: "#FF6B2C",
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10,
  },
  backCtaText: { color: "white", fontWeight: "800" },
  hero: { height: 380, backgroundColor: "#F1EFE8" },
  topBar: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between",
  },
  topBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  heroBadge: {
    position: "absolute", left: 16,
    backgroundColor: "#FF6B2C",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  heroBadgeText: { color: "white", fontSize: 14, fontWeight: "800" },
  store: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5 },
  name: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginTop: 6, letterSpacing: -0.5 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 12, gap: 10 },
  priceNow: { color: "#FF6B2C", fontSize: 28, fontWeight: "800" },
  priceWas: { color: "#94A3B8", fontSize: 15, textDecorationLine: "line-through" },
  savePill: {
    backgroundColor: "#ECFDF5", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
  },
  savePillText: { color: "#166534", fontSize: 11, fontWeight: "800" },
  urgency: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFE7D1",
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    marginTop: 16,
  },
  urgencyText: { fontSize: 13, fontWeight: "700", color: "#854F0B" },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 24 },
  description: { fontSize: 13.5, color: "#334155", marginTop: 6, lineHeight: 21 },
  trustRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  trustBox: {
    flex: 1, padding: 12, backgroundColor: "white", borderRadius: 12, alignItems: "center",
  },
  trustLbl: { fontSize: 10.5, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: "white",
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.08)",
  },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heartBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#F1EFE8",
    alignItems: "center", justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FF6B2C", paddingVertical: 16, borderRadius: 14,
  },
  addBtnText: { color: "white", fontSize: 15, fontWeight: "800" },
});
