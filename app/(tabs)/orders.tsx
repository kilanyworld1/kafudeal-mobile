import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ordersAPI } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth-context";
import type { Order } from "../../lib/types";

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready", "on_the_way", "out_for_delivery"];
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:       { label: "PENDING",    color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
  confirmed:     { label: "CONFIRMED",  color: "#1D4ED8", bg: "rgba(29,78,216,0.15)" },
  preparing:     { label: "PREPARING",  color: "#B45309", bg: "rgba(245,158,11,0.15)" },
  ready:         { label: "READY",      color: "#7C3AED", bg: "rgba(124,58,237,0.15)" },
  on_the_way:    { label: "ON THE WAY", color: "#1D4ED8", bg: "rgba(29,78,216,0.15)" },
  out_for_delivery: { label: "OUT FOR DELIVERY", color: "#1D4ED8", bg: "rgba(29,78,216,0.15)" },
  delivered:     { label: "DELIVERED",  color: "#15803D", bg: "rgba(34,197,94,0.15)" },
  cancelled:     { label: "CANCELLED",  color: "#DC2626", bg: "rgba(220,38,38,0.15)" },
};

export default function Orders() {
  const insets = useSafeAreaInsets();
  const { customer, user } = useAuth();
  const [tab, setTab] = useState<"active" | "past">("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!customer?.id) {
      setOrders([]);
      return;
    }
    const { data } = await ordersAPI.getOrders(customer.id);
    setOrders(data);
  }, [customer?.id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    })();
  }, [fetchOrders]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  // Realtime: refetch when ANY of this customer's orders change
  useEffect(() => {
    if (!customer?.id) return;
    const channel = supabase
      .channel(`orders-${customer.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${customer.id}` },
        () => fetchOrders()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const { active, past } = useMemo(() => {
    return {
      active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status.toLowerCase())),
      past: orders.filter((o) => !ACTIVE_STATUSES.includes(o.status.toLowerCase())),
    };
  }, [orders]);

  const showSignedOut = !user;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>My Orders</Text>
        <Text style={s.subtitle}>Track and reorder anytime</Text>

        <View style={s.tabRow}>
          <Pressable onPress={() => setTab("active")} style={[s.tab, tab === "active" && s.tabActive]}>
            <Text style={[s.tabText, tab === "active" && s.tabTextActive]}>Active ({active.length})</Text>
          </Pressable>
          <Pressable onPress={() => setTab("past")} style={[s.tab, tab === "past" && s.tabActive]}>
            <Text style={[s.tabText, tab === "past" && s.tabTextActive]}>Past ({past.length})</Text>
          </Pressable>
        </View>
      </View>

      {showSignedOut ? (
        <View style={s.empty}>
          <Ionicons name="lock-closed-outline" size={48} color="#CBD5E1" />
          <Text style={s.emptyTitle}>Sign in to see your orders</Text>
          <Text style={s.emptySub}>We'll keep your order history synced across devices</Text>
          <Pressable onPress={() => router.push("/login")} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Sign in</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={s.empty}>
          <ActivityIndicator color="#FF6B2C" size="large" />
          <Text style={[s.emptySub, { marginTop: 16 }]}>Loading your orders…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B2C" />
          }
        >
          {tab === "active" ? (
            active.length === 0 ? (
              <EmptyState icon="cube-outline" title="No active orders" sub="Your active orders will show here" />
            ) : (
              active.map((o) => <ActiveCard key={o.id} order={o} />)
            )
          ) : past.length === 0 ? (
            <EmptyState icon="time-outline" title="No past orders yet" sub="Once you order, history will appear here" />
          ) : (
            past.map((o) => <PastRow key={o.id} order={o} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ActiveCard({ order }: { order: Order }) {
  const meta = STATUS_LABELS[order.status.toLowerCase()] || STATUS_LABELS.confirmed;
  const items = order.items || [];
  const imgs = items.slice(0, 3).map((it) => it.product?.image).filter(Boolean);
  return (
    <Pressable onPress={() => router.push(`/order/${order.id}`)} style={s.card}>
      <View style={s.cardTop}>
        <View>
          <Text style={s.cardLabel}>ORDER</Text>
          <Text style={s.cardId}>#{order.shortId}</Text>
          <Text style={s.cardDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.cardLabel}>Total</Text>
          <Text style={s.cardTotal}>AED {order.total.toFixed(2)}</Text>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <View style={[s.liveDot, { backgroundColor: meta.color }]} />
            <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>
      <View style={s.imgRow}>
        {imgs.map((img, i) => (
          <Image key={i} source={{ uri: img! }} style={s.imgChip} />
        ))}
        <Text style={s.itemsText}>{order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}</Text>
      </View>
      <View style={s.cardActions}>
        <View style={s.trackChip}>
          <Ionicons name="navigate" size={12} color="#FF6B2C" />
          <Text style={s.trackText}>Track order</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </Pressable>
  );
}

function PastRow({ order }: { order: Order }) {
  const meta = STATUS_LABELS[order.status.toLowerCase()] || STATUS_LABELS.delivered;
  const items = order.items || [];
  const imgs = items.slice(0, 3).map((it) => it.product?.image).filter(Boolean);
  return (
    <Pressable onPress={() => router.push(`/order/${order.id}`)} style={s.pastCard}>
      <View style={s.pastImgRow}>
        {imgs.map((img, i) => (
          <Image key={i} source={{ uri: img! }} style={s.pastImg} />
        ))}
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={s.pastId}>#{order.shortId}</Text>
        <Text style={s.pastDate}>{formatDate(order.createdAt)} · {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}</Text>
        <View style={[s.statusPill, { backgroundColor: meta.bg, alignSelf: "flex-start", marginTop: 6 }]}>
          <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={s.pastTotal}>AED {order.total.toFixed(2)}</Text>
        <Pressable style={s.reorderBtn}>
          <Ionicons name="refresh" size={12} color="#FF6B2C" />
          <Text style={s.reorderText}>Reorder</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function EmptyState({ icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <View style={s.emptyMini}>
      <Ionicons name={icon} size={56} color="#CBD5E1" />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
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
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyMini: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: "center", lineHeight: 19 },
  emptyBtn: {
    backgroundColor: "#FF6B2C", paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginTop: 24,
  },
  emptyBtnText: { color: "white", fontSize: 14, fontWeight: "800" },
});
