import { useRef } from "react";
import { View, Text, Image, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Product } from "../data/products";
import { useCart } from "../lib/cart-context";

type Props = {
  product: Product;
  width?: number;
  variant?: "default" | "compact";
};

export default function ProductCard({ product: p, width, variant = "default" }: Props) {
  const { add, toggleSaved, isSaved } = useCart();
  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;
  const saved = isSaved(p.id);

  const pressHeart = () => {
    toggleSaved(p.id, p.name);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.5, duration: 140, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const pressAdd = (e: any) => {
    e.stopPropagation?.();
    add(p);
    Animated.sequence([
      Animated.timing(addScale, { toValue: 0.85, duration: 90, useNativeDriver: true }),
      Animated.spring(addScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const urgent = (p.endsIn || "").toLowerCase().includes("h left");

  return (
    <Pressable
      onPress={() => router.push(`/product/${p.id}`)}
      style={[s.card, width ? { width } : null]}
    >
      <View style={s.imgWrap}>
        <Image source={{ uri: p.image }} style={{ width: "100%", height: "100%" }} />
        <View style={s.disc}><Text style={s.discText}>-{p.discount}%</Text></View>
        <Pressable onPress={pressHeart} style={s.favBtn} hitSlop={8}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={18}
              color={saved ? "#DC2626" : "#0F172A"}
            />
          </Animated.View>
        </Pressable>
      </View>
      <Text style={s.store} numberOfLines={1}>{p.store}</Text>
      <Text style={s.name} numberOfLines={1}>{p.name}</Text>
      <View style={s.footRow}>
        <View style={{ flex: 1 }}>
          <View style={s.priceRow}>
            <Text style={s.priceNow}>AED {p.price}</Text>
            <Text style={s.priceWas}>AED {p.was}</Text>
          </View>
          <View style={s.endsRow}>
            <Ionicons name="time-outline" size={11} color={urgent ? "#DC2626" : "#64748B"} />
            <Text style={[s.endsText, urgent && { color: "#DC2626", fontWeight: "800" }]}>
              {p.endsIn}
            </Text>
          </View>
        </View>
        <Pressable onPress={pressAdd} hitSlop={8}>
          <Animated.View style={[s.addBtn, { transform: [{ scale: addScale }] }]}>
            <Ionicons name="add" size={18} color="white" />
          </Animated.View>
        </Pressable>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { width: 160 },
  imgWrap: {
    aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#F1EFE8",
  },
  disc: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#FF6B2C",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  discText: { color: "white", fontSize: 11, fontWeight: "800" },
  favBtn: {
    position: "absolute", top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center", justifyContent: "center",
  },
  store: { fontSize: 9.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5, marginTop: 8 },
  name: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  footRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  priceNow: { color: "#FF6B2C", fontSize: 15, fontWeight: "800" },
  priceWas: { color: "#94A3B8", fontSize: 11, textDecorationLine: "line-through" },
  endsRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  endsText: { fontSize: 10.5, color: "#64748B", fontWeight: "600" },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#FF6B2C",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF6B2C", shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 3,
  },
});
