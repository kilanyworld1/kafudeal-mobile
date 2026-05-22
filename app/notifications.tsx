import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

type Notif = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconColor: string;
  image?: string;
  cta?: string;
};

const TODAY: Notif[] = [
  {
    id: "n1",
    title: "Order on the way 🛵",
    body: "Your order #KFD-A3F8B921 is ~10 min away. Tap to track.",
    time: "Just now", unread: true,
    icon: "bicycle", tint: "#FFE7D1", iconColor: "#FF6B2C",
    cta: "Track order →",
  },
  {
    id: "n2",
    title: "Flash deal — Lindt 85% Dark",
    body: "70% off · only 8 left at this price.",
    time: "1h ago", unread: true,
    icon: "flame", tint: "#FEE2E2", iconColor: "#DC2626",
    image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200&q=80",
  },
  {
    id: "n3",
    title: "You earned a voucher 🎁",
    body: "KAFU10 — Save AED 10 on your next order.",
    time: "Today · 09:14", unread: false,
    icon: "ticket", tint: "#ECFDF5", iconColor: "#16A34A",
  },
];

const EARLIER: Notif[] = [
  {
    id: "n4",
    title: "Order delivered ✅",
    body: "Order #KFD-2D9F1C44 was delivered. Rate your experience.",
    time: "Yesterday", unread: false,
    icon: "checkmark-circle", tint: "#ECFDF5", iconColor: "#15803D",
  },
  {
    id: "n5",
    title: "New iftar deals just landed 🌙",
    body: "Up to 60% off on dates, fresh and dairy.",
    time: "2 days ago", unread: false,
    icon: "moon", tint: "#EAF3FF", iconColor: "#1D4ED8",
  },
  {
    id: "n6",
    title: "Price dropped on a saved item",
    body: "Artisan Sourdough is now AED 9 (was AED 20).",
    time: "3 days ago", unread: false,
    icon: "trending-down", tint: "#FFE7D1", iconColor: "#FF6B2C",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80",
  },
];

export default function Notifications() {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Notifications</Text>
        <Pressable style={s.iconBtn}>
          <Ionicons name="checkmark-done" size={22} color="#FF6B2C" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Text style={s.section}>TODAY</Text>
        {TODAY.map((n) => <NotifRow key={n.id} n={n} />)}

        <Text style={[s.section, { marginTop: 18 }]}>EARLIER</Text>
        {EARLIER.map((n) => <NotifRow key={n.id} n={n} />)}

        <View style={s.footer}>
          <Ionicons name="notifications-outline" size={18} color="#94A3B8" />
          <Text style={s.footerText}>You're all caught up</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function NotifRow({ n }: { n: Notif }) {
  return (
    <Pressable style={[s.card, n.unread && s.cardUnread]}>
      {n.image ? (
        <Image source={{ uri: n.image }} style={s.thumb} />
      ) : (
        <View style={[s.iconWrap, { backgroundColor: n.tint }]}>
          <Ionicons name={n.icon} size={20} color={n.iconColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={1}>{n.title}</Text>
          {n.unread && <View style={s.unreadDot} />}
        </View>
        <Text style={s.body}>{n.body}</Text>
        <View style={s.metaRow}>
          <Text style={s.time}>{n.time}</Text>
          {n.cta && <Text style={s.cta}>{n.cta}</Text>}
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
  thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#F1EFE8" },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "800", color: "#0F172A", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B2C", marginLeft: 8 },
  body: { fontSize: 12.5, color: "#334155", marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  time: { fontSize: 11, color: "#94A3B8" },
  cta: { fontSize: 12, color: "#FF6B2C", fontWeight: "800" },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 18, padding: 12,
  },
  footerText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
});
