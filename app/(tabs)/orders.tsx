import { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const ACTIVE = [
  {
    id: "KFD-A3F8B921",
    date: "5 May 2026 · 14:23",
    total: 62.40,
    status: "PREPARING",
    statusColor: "#B45309",
    statusBg: "rgba(245,158,11,0.15)",
    items: 3,
    images: [
      "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200&q=80",
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80",
    ],
  },
];

const PAST = [
  {
    id: "KFD-2D9F1C44",
    date: "3 May 2026 · 5 items",
    total: 84.50,
    status: "DELIVERED",
    statusColor: "#15803D",
    statusBg: "rgba(34,197,94,0.15)",
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80",
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200&q=80",
    ],
  },
  {
    id: "KFD-7B0E5A12",
    date: "29 Apr 2026 · 2 items",
    total: 35.00,
    status: "DELIVERED",
    statusColor: "#15803D",
    statusBg: "rgba(34,197,94,0.15)",
    images: [
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&q=80",
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80",
    ],
  },
  {
    id: "KFD-F2D986DA",
    date: "21 Apr 2026 · 1 item",
    total: 17.00,
    status: "DELIVERED",
    statusColor: "#15803D",
    statusBg: "rgba(34,197,94,0.15)",
    images: [
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&q=80",
    ],
  },
];

export default function Orders() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"active" | "past">("active");

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>My Orders</Text>
        <Text style={s.subtitle}>Track and reorder anytime</Text>

        <View style={s.tabRow}>
          <Pressable
            onPress={() => setTab("active")}
            style={[s.tab, tab === "active" && s.tabActive]}
          >
            <Text style={[s.tabText, tab === "active" && s.tabTextActive]}>
              Active ({ACTIVE.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("past")}
            style={[s.tab, tab === "past" && s.tabActive]}
          >
            <Text style={[s.tabText, tab === "past" && s.tabTextActive]}>
              Past ({PAST.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {tab === "active" ? (
          ACTIVE.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No active orders"
              sub="Your active orders will show here"
            />
          ) : (
            ACTIVE.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/order/${o.id}`)}
                style={s.card}
              >
                <View style={s.cardTop}>
                  <View>
                    <Text style={s.cardLabel}>ORDER</Text>
                    <Text style={s.cardId}>#{o.id}</Text>
                    <Text style={s.cardDate}>{o.date}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.cardLabel}>Total</Text>
                    <Text style={s.cardTotal}>AED {o.total.toFixed(2)}</Text>
                    <View style={[s.statusPill, { backgroundColor: o.statusBg }]}>
                      <View style={[s.liveDot, { backgroundColor: o.statusColor }]} />
                      <Text style={[s.statusText, { color: o.statusColor }]}>{o.status}</Text>
                    </View>
                  </View>
                </View>

                <View style={s.imgRow}>
                  {o.images.slice(0, 3).map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={s.imgChip} />
                  ))}
                  <Text style={s.itemsText}>{o.items} items</Text>
                </View>

                <View style={s.cardActions}>
                  <View style={s.trackChip}>
                    <Ionicons name="navigate" size={12} color="#FF6B2C" />
                    <Text style={s.trackText}>Track order</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            ))
          )
        ) : (
          PAST.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => router.push(`/order/${o.id}`)}
              style={s.pastCard}
            >
              <View style={s.pastImgRow}>
                {o.images.slice(0, 3).map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={s.pastImg} />
                ))}
              </View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={s.pastId}>#{o.id}</Text>
                <Text style={s.pastDate}>{o.date}</Text>
                <View style={[s.statusPill, { backgroundColor: o.statusBg, alignSelf: "flex-start", marginTop: 6 }]}>
                  <Text style={[s.statusText, { color: o.statusColor }]}>{o.status}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.pastTotal}>AED {o.total.toFixed(2)}</Text>
                <Pressable style={s.reorderBtn}>
                  <Ionicons name="refresh" size={12} color="#FF6B2C" />
                  <Text style={s.reorderText}>Reorder</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={64} color="#CBD5E1" />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    paddingHorizontal: 20, paddingBottom: 8, backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.08)",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  tab: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: "#F1EFE8",
  },
  tabActive: { backgroundColor: "#0F172A" },
  tabText: { color: "#334155", fontSize: 13, fontWeight: "800" },
  tabTextActive: { color: "white" },
  card: {
    backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { fontSize: 10.5, color: "#94A3B8", fontWeight: "800", letterSpacing: 0.5 },
  cardId: { fontFamily: "Menlo", fontSize: 15, fontWeight: "800", color: "#0F172A", marginTop: 3 },
  cardDate: { fontSize: 12, color: "#64748B", marginTop: 4 },
  cardTotal: { fontSize: 22, fontWeight: "800", color: "#FF6B2C", marginTop: 2 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginTop: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  imgRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  imgChip: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#F1EFE8" },
  itemsText: { fontSize: 12, color: "#64748B", marginLeft: 4, fontWeight: "600" },
  cardActions: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.06)",
  },
  trackChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "#FFE7D1", borderRadius: 999,
  },
  trackText: { color: "#FF6B2C", fontSize: 12, fontWeight: "800" },
  pastCard: {
    flexDirection: "row", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 12, marginBottom: 10,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  pastImgRow: { flexDirection: "column", gap: 2 },
  pastImg: { width: 44, height: 22, borderRadius: 4, backgroundColor: "#F1EFE8" },
  pastId: { fontFamily: "Menlo", fontSize: 13, fontWeight: "800", color: "#0F172A" },
  pastDate: { fontSize: 11.5, color: "#64748B", marginTop: 3 },
  pastTotal: { fontSize: 16, fontWeight: "800", color: "#FF6B2C" },
  reorderBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: "#FFE7D1", borderRadius: 999,
  },
  reorderText: { color: "#FF6B2C", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", padding: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 6, textAlign: "center" },
});
