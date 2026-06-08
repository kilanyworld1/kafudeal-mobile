import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useNotifications, Notification } from "../lib/notifications-context";
import { useAuth } from "../lib/auth-context";

type IconMeta = { icon: keyof typeof Ionicons.glyphMap; tint: string; iconColor: string };

function iconForType(type: string): IconMeta {
  if (type.startsWith("order_status_delivered")) {
    return { icon: "checkmark-circle", tint: "#ECFDF5", iconColor: "#15803D" };
  }
  if (type.startsWith("order_status_out_for_delivery") || type.includes("out_for_delivery")) {
    return { icon: "bicycle", tint: "#FFE7D1", iconColor: "#FF6B2C" };
  }
  if (type.startsWith("order_status_preparing")) {
    return { icon: "cube", tint: "#EEF2FF", iconColor: "#4F46E5" };
  }
  if (type.startsWith("order_status_ready")) {
    return { icon: "bag-handle", tint: "#FEF3C7", iconColor: "#92400E" };
  }
  if (type.startsWith("order_status_cancelled")) {
    return { icon: "close-circle", tint: "#FEE2E2", iconColor: "#DC2626" };
  }
  if (type.startsWith("order_status_refunded")) {
    return { icon: "cash", tint: "#ECFDF5", iconColor: "#15803D" };
  }
  if (type.startsWith("order")) {
    return { icon: "receipt", tint: "#FFE7D1", iconColor: "#FF6B2C" };
  }
  return { icon: "notifications", tint: "#F1EFE8", iconColor: "#0F172A" };
}

function useFormatTime() {
  const { t } = useTranslation();
  return (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return t("notifications.just_now");
    if (diffMin < 60) return t("notifications.minutes_ago", { count: diffMin });
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return t("notifications.hours_ago", { count: diffHrs });
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return t("notifications.yesterday");
    if (diffDays < 7) return t("notifications.days_ago", { count: diffDays });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, loading, refresh, markRead, markAllRead } = useNotifications();

  const { today, earlier } = useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];
    for (const n of notifications) {
      if (isToday(n.created_at)) today.push(n);
      else earlier.push(n);
    }
    return { today, earlier };
  }, [notifications]);

  const handlePress = async (n: Notification) => {
    if (!n.read) await markRead(n.id);
    if (n.related_type === "order" && n.related_id) {
      router.push(`/order/${n.related_id}`);
    } else if (n.related_type === "product" && n.related_id) {
      router.push(`/product/${n.related_id}`);
    }
  };

  const backIconStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] as any } : undefined;

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)");
          }}
          style={s.iconBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" style={backIconStyle} />
        </Pressable>
        <Text style={s.topTitle}>{t("notifications.title")}</Text>
        <Pressable
          style={s.iconBtn}
          onPress={() => markAllRead()}
          hitSlop={12}
        >
          <Ionicons name="checkmark-done" size={22} color="#FF6B2C" />
        </Pressable>
      </View>

      {!user ? (
        <View style={s.empty}>
          <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
          <Text style={s.emptyTitle}>{t("notifications.signed_out_title")}</Text>
          <Text style={s.emptySub}>{t("notifications.signed_out_sub")}</Text>
          <Pressable onPress={() => router.push("/login")} style={s.emptyCta}>
            <Text style={s.emptyCtaText}>{t("auth.sign_in")}</Text>
          </Pressable>
        </View>
      ) : loading && notifications.length === 0 ? (
        <View style={s.empty}>
          <ActivityIndicator color="#FF6B2C" size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="notifications-outline" size={48} color="#94A3B8" />
          <Text style={s.emptyTitle}>{t("notifications.all_caught_up_title")}</Text>
          <Text style={s.emptySub}>{t("notifications.all_caught_up_sub")}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#FF6B2C" />}
        >
          {today.length > 0 && (
            <>
              <Text style={s.section}>{t("notifications.today")}</Text>
              {today.map((n) => <NotifRow key={n.id} n={n} onPress={() => handlePress(n)} />)}
            </>
          )}

          {earlier.length > 0 && (
            <>
              <Text style={[s.section, today.length > 0 && { marginTop: 18 }]}>{t("notifications.earlier")}</Text>
              {earlier.map((n) => <NotifRow key={n.id} n={n} onPress={() => handlePress(n)} />)}
            </>
          )}

          <View style={s.footer}>
            <Ionicons name="notifications-outline" size={18} color="#94A3B8" />
            <Text style={s.footerText}>{t("notifications.everything_for_now")}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function NotifRow({ n, onPress }: { n: Notification; onPress: () => void }) {
  const { t } = useTranslation();
  const formatTime = useFormatTime();
  const meta = iconForType(n.type);
  return (
    <Pressable onPress={onPress} style={[s.card, !n.read && s.cardUnread]}>
      <View style={[s.iconWrap, { backgroundColor: meta.tint }]}>
        <Ionicons name={meta.icon} size={20} color={meta.iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={1}>{n.title}</Text>
          {!n.read && <View style={s.unreadDot} />}
        </View>
        {n.body ? <Text style={s.body}>{n.body}</Text> : null}
        <View style={s.metaRow}>
          <Text style={s.time}>{formatTime(n.created_at)}</Text>
          {n.related_type === "order" && (
            <Text style={s.cta}>{t("notifications.track_order")} {I18nManager.isRTL ? "←" : "→"}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  iconBtn: { padding: 6 },
  topTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  section: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginBottom: 10 },
  card: {
    flexDirection: "row", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardUnread: {
    backgroundColor: "#FFF4EC",
    borderWidth: 1, borderColor: "rgba(255,107,44,0.20)",
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "800", color: "#0F172A", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B2C", marginStart: 8 },
  body: { fontSize: 12.5, color: "#334155", marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  time: { fontSize: 11, color: "#94A3B8" },
  cta: { fontSize: 12, color: "#FF6B2C", fontWeight: "800" },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 18, padding: 12,
  },
  footerText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 40, gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center", marginTop: -4 },
  emptyCta: {
    marginTop: 12, backgroundColor: "#FF6B2C",
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10,
  },
  emptyCtaText: { color: "white", fontWeight: "800" },
});
