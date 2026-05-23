import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { productsAPI } from "../lib/api";
import { transformProduct } from "../lib/transformers";
import type { Product } from "../lib/types";

const recents = ["Lindt chocolate", "Milk 2L", "Sourdough", "Cheese"];
const trending = ["Iftar deals", "Strawberries", "Nivea", "Yogurt", "Sushi"];
const phrases = [
  "Try 'chocolate'",
  "Try 'sourdough'",
  "Try 'milk 2L'",
  "Try 'iftar deals'",
  "Try 'strawberries'",
];

export default function Search() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<any>(null);

  // Typewriter loop
  useEffect(() => {
    let pi = 0, ci = 0, deleting = false;
    let timer: any;
    const tick = () => {
      const word = phrases[pi];
      if (!deleting) {
        ci++;
        setPlaceholder(word.slice(0, ci));
        if (ci === word.length) {
          deleting = true;
          timer = setTimeout(tick, 1500);
          return;
        }
      } else {
        ci--;
        setPlaceholder(word.slice(0, ci));
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
        }
      }
      timer = setTimeout(tick, deleting ? 35 : 75);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // Debounced live search
  useEffect(() => {
    clearTimeout(debounce.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      const { data } = await productsAPI.getProducts({ search: q.trim(), from: 0, to: 49 });
      setResults((data || []).map(transformProduct));
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [q]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <View style={s.inputWrap}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            style={s.input}
            autoFocus
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {q.length === 0 ? (
          <>
            <Text style={s.section}>RECENT</Text>
            {recents.map((r) => (
              <Pressable key={r} style={s.row} onPress={() => setQ(r)}>
                <Ionicons name="time-outline" size={18} color="#64748B" />
                <Text style={s.rowText}>{r}</Text>
                <Ionicons name="arrow-up-outline" size={16} color="#94A3B8" style={{ transform: [{ rotate: "45deg" }] }} />
              </Pressable>
            ))}
            <Text style={[s.section, { marginTop: 18 }]}>TRENDING NOW</Text>
            <View style={s.chips}>
              {trending.map((t) => (
                <Pressable key={t} style={s.chip} onPress={() => setQ(t)}>
                  <Ionicons name="flame" size={12} color="#FF6B2C" />
                  <Text style={s.chipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : searching ? (
          <View style={{ padding: 30, alignItems: "center" }}>
            <ActivityIndicator color="#FF6B2C" />
            <Text style={{ color: "#94A3B8", marginTop: 10 }}>Searching…</Text>
          </View>
        ) : (
          <>
            <Text style={s.section}>{results.length} RESULTS FOR "{q.toUpperCase()}"</Text>
            {results.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="search-outline" size={36} color="#94A3B8" />
                <Text style={s.emptyText}>No matches. Try a different word.</Text>
              </View>
            ) : (
              results.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => { router.dismiss(); router.push(`/product/${p.id}`); }}
                  style={s.resultRow}
                >
                  <Image source={{ uri: p.image }} style={s.resultImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultStore}>{p.store}</Text>
                    <Text style={s.resultName}>{p.name}</Text>
                    <View style={s.priceRow}>
                      <Text style={s.priceNow}>AED {p.discountedPrice}</Text>
                      <Text style={s.priceWas}>AED {p.originalPrice}</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  topBar: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8, backgroundColor: "white", borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  backBtn: { padding: 6 },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F1EFE8", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#0F172A", padding: 0 },
  section: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginBottom: 10 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.05)",
  },
  rowText: { flex: 1, fontSize: 14, color: "#0F172A" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "white", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
  },
  chipText: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { color: "#64748B", marginTop: 12, fontSize: 13 },
  resultRow: {
    flexDirection: "row", gap: 12, alignItems: "center", padding: 10,
    backgroundColor: "white", borderRadius: 12, marginBottom: 8,
  },
  resultImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#F1EFE8" },
  resultStore: { fontSize: 9.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5 },
  resultName: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4, gap: 6 },
  priceNow: { color: "#FF6B2C", fontSize: 14, fontWeight: "800" },
  priceWas: { color: "#94A3B8", fontSize: 11, textDecorationLine: "line-through" },
});
