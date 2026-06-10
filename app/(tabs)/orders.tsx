import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ordersAPI } from "../../lib/api";
import { transformOrder } from "../../lib/transformers";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth-context";
import type { Order } from "../../lib/types";

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready", "on_the_way", "out_for_delivery"];

// Status metadata: colors stay the same, labels come from i18n via t(meta.key)
// at render time. That way "PREPARING" → "قيد التحضير" when the app is Arabic.
const STATUS_META: Record<string, { color: string; bg: string; key: string }> = {
  pending:          { color: "#94A3B8", bg: "rgba(148,163,184,0.15)", key: "status.pending_caps" },
  confirmed:        { color: "#1D4ED8", bg: "rgba(29,78,216,0.15)",  key: "status.confirmed_caps" },
  preparing:        { color: "#B45309", bg: "rgba(245,158,11,0.15)", key: "status.preparing_caps" },
  ready:            { color: "#7C3AED", bg: "rgba(124,58,237,0.15)", key: "status.ready_caps" },
  on_the_way:       { color: "#1D4ED8", bg: "rgba(29,78,216,0.15)",  key: "status.on_the_way_caps" },
  out_for_delivery: { color: "#1D4ED8", bg: "rgba(29,78,216,0.15)",  key: "status.out_for_delivery_caps" },
  delivered:        { color: "#15803D", bg: "rgba(34,197,94,0.15)",  key: "status.delivered_caps" },
  cancelled:        { color: "#DC2626", bg: "rgba(220,38,38,0.15)",  key: "status.cancelled_caps" },
};

export default function Orders() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { customer, user } = useAuth();
  const [tab, setTab] = useState<"active" | "past">("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const lastFetchRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    if (!customer?.id) return;
    const { data } = await ordersAPI.getMyOrders({ from: 0, to: 49 });
    setOrders((data || []).map(transformOrder));
    lastFetchRef.current = Date.now();
  }, [customer?.id]);

  // Single source of truth for the screen's lifecycle vs. auth state.
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      lastFetchRef.current = 0;
      return;
    }
    if (!customer?.id) {
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      await fetchOrders();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, customer?.id, fetchOrders]);

  // Refetch on focus, but skip if we fetched within the last 10 seconds
  useFocusEffect(
    useCallback(() => {
      if (!customer?.id) return;
      if (Date.now() - lastFetchRef.current > 10000) {
        fetchOrders();
      }
    }, [customer?.id, fetchOrders])
  );

  // Realtime: refetch when ANY of this customer's orders change.
  useEffect(() => {
    if (!customer?.id) return;
    const channel = supabase
      .channel(`orders-${customer.id}-${user?.id ?? "anon"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${customer.id}` },
        () => fetchOrders()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer?.id, user?.id, fetchOrders]);

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
  const locale = i18n.language === "ar" ? "ar-AE" : "en-GB";

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>{t("orders.my_orders_title")}</Text>
        <Text style={s.subtitle}>{t("orders.track_subtitle")}</Text>

        <View style={s.tabRow}>
          <Pressable onPress={() => setTab("active")} style={[s.tab, tab === "active" && s.tabActive]}>
            <Text style={[s.tabText, tab === "active" && s.tabTextActive]}>
              {t("orders.tab_active_count", { count: active.length })}
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab("past")} style={[s.tab, tab === "past" && s.tabActive]}>
            <Text style={[s.tabText, tab === "past" && s.tabTextActive]}>
              {t("orders.tab_past_count", { count: past.length })}
            </Text>
          </Pressable>
        </View>
      </View>

      {showSignedOut ? (
        <View style={s.empty}>
          <Ionicons name="lock-closed-outline" size={48} color="#CBD5E1" />
          <Text style={s.emptyTitle}>{t("orders.signed_out_title")}</Text>
          <Text style={s.emptySub}>{t("orders.signed_out_sub")}</Text>
          <Pressable onPress={() => router.push("/login")} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>{t("auth.sign_in")}</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={s.empty}>
          <ActivityIndicator color="#FF6B2C" size="large" />
          <Text style={[s.emptySub, { marginTop: 16 }]}>{t("orders.loading")}</Text>
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
              <EmptyState icon="cube-outline" title={t("orders.no_active")} sub={t("orders.no_active_sub")} />
            ) : (
              active.map((o) => <ActiveCard key={o.id} order={o} t={t} locale={locale} />)
            )
          ) : past.length === 0 ? (
            <EmptyState icon="time-outline" title={t("orders.no_past")} sub={t("orders.no_past_sub")} />
          ) : (
            past.map((o) => <PastRow key={o.id} order={o} t={t} locale={locale} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ActiveCard({ order, t, locale }: { order: Order; t: any; locale: string }) {
  const meta = STATUS_META[order.status.toLowerCase()] || STATUS_META.confirmed;
  const items = order.items || [];
  const imgs = items.slice(0, 3).map((it) => it.product?.image).filter(Boolean);
  return (
    <Pressable onPress={() => router.push(`/order/${order.id}`)} style={s.card}>
      <View style={s.cardTop}>
        <View>
          <Text style={s.cardLabel}>{t("orders.order_label")}</Text>
          <Text style={s.cardId}>#{order.shortId}</Text>
          <Text style={s.cardDate}>{formatDate(order.createdAt, locale)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.cardLabel}>{t("orders.total_label")}</Text>
          <Text style={s.cardTotal}>AED {order.total.toFixed(2)}</Text>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <View style={[s.liveDot, { backgroundColor: meta.color }]} />
            <Text style={[s.statusText, { color: meta.color }]}>{t(meta.key)}</Text>
          </View>
        </View>
      </View>
      <View style={s.imgRow}>
        {imgs.map((img, i) => (
          <Image key={i} source={{ uri: img! }} style={s.imgChip} />
        ))}
        <Text style={s.itemsText}>
          {order.itemsCount === 1 ? t("home.items_count_one") : t("home.items_count", { count: order.itemsCount })}
        </Text>
      </View>
      <View style={s.cardActions}>
        <View style={s.trackChip}>
          <Ionicons name="navigate" size={12} color="#FF6B2C" />
          <Text style={s.trackText}>{t("orders.track")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </Pressable>
  );
}

function PastRow({ order, t, locale }: { order: Order; t: any; locale: string }) {
  const meta = STATUS_META[order.status.toLowerCase()] || STATUS_META.delivered;
  const items = order.items || [];
  const imgs = items.slice(0, 3).map((it) => it.product?.image).filter(Boolean);
  return (
    <Pressable onPress={() => router.push(`/order/${order.id}`)} style={s.card}>
      <View style={s.cardTop}>
        <View>
          <Text style={s.cardLabel}>{t("orders.order_label")}</Text>
          <Text style={s.cardId}>#{order.shortId}</Text>
          <Text style={s.cardDate}>{formatDate(order.createdAt, locale)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.cardLabel}>{t("orders.total_label")}</Text>
          <Text style={s.cardTotal}>AED {order.total.toFixed(2)}</Text>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[s.statusText, { color: meta.color }]}>{t(meta.key)}</Text>
          </View>
        </View>
      </View>

      {imgs.length > 0 && (
        <View style={s.imgRow}>
          {imgs.map((img, i) => (
            <Image key={i} source={{ uri: img! }} style={s.imgChip} />
          ))}
          <Text style={s.itemsText}>
            {order.itemsCount === 1 ? t("home.items_count_one") : t("home.items_count", { count: order.itemsCount })}
          </Text>
        </View>
      )}

      <View style={s.cardActions}>
        <Pressable style={s.reorderBtn} onPress={(e) => e.stopPropagation?.()}>
          <Ionicons name="refresh" size={12} color="#FF6B2C" />
          <Text style={s.reorderText}>{t("orders.reorder")}</Text>
        </Pressable>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
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

function formatDate(iso: string | undefined, locale: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
