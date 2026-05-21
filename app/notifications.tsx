import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const notifs = [
  {
    id: "n1", type: "order",
    title: "Order on the way 🛵",
    body: "Your order #K284615 will arrive in ~10 minutes.",
    time: "Just now", unread: true,
    icon: "bicycle" as const, tint: "#FFE7D1", iconColor: "#FF6B2C",
  },
  {
    id: "n2", type: "deal",
    title: "Flash deal: Lindt 85% Dark −70%",
    body: "Only 8 left at this price. Ends in 2h.",
    time: "1h ago", unread: true,
    icon: "flame" as const, tint: "#FFEAEA", iconColor: "#DC2626",
  },
  {
    id: "n3", type: "voucher",
    title: "You got a voucher 🎁",
    body: "KAFU10 — Save 10 AED on your next order.",
    time: "Today", unread: false,
    icon: "ticket" as const, tint: "#ECFDF5", iconColor: "#16A34A",
  },
  {
    id: "n4", type: "order",
    title: "Order delivered ✅",
    body: "Order #K217234 was delivered. Rate your experience.",
    time: "Yesterday", unread: false,
    icon: "checkmark-circle" as const, tint: "#ECFDF5", iconColor: "#16A34A",
  },
  {
    id: "n5", type: "category",
    title: "New iftar deals just landed 🌙",
    body: "Up to 60% off on dates, fresh and dairy.",
    time: "2 days ago", unread: false,
    icon: "moon" as const, tint: "#EAF3FF", iconColor: "#1D4ED8",
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
        {notifs.map((n) => (
          <Pressable key={n.id} style={[s.card, n.unread && s.cardUnread]}>
            <View style={[s.iconWrap, { backgroundColor: n.tint }]}>
              <Ionicons name={n.icon} size={20} color={n.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.titleRow}>
                <Text style={s.title}>{n.title}</Text>
                {n.unread && <View style={s.unreadDot} />}
              </View>
              <Text style={s.body}>{n.body}</Text>
              <Text style={s.time}>{n.time}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
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
  card: {
    flexDirection: "row", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 14, marginBottom: 10,
  },
  cardUnread: { backgroundColor: "#FFF4EC" },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "800", color: "#0F172A", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B2C", marginLeft: 8 },
  body: { fontSize: 12.5, color: "#334155", marginTop: 3, lineHeight: 18 },
  time: { fontSize: 11, color: "#94A3B8", marginTop: 6 },
});
