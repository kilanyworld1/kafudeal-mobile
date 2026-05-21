import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import KafuMark from "../../components/KafuMark";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  route: string;
};

const menu: MenuItem[] = [
  { icon: "location-outline", label: "Addresses", sub: "2 saved", route: "/addresses" },
  { icon: "heart-outline",    label: "Saved deals", sub: "4 items", route: "/saved" },
  { icon: "ticket-outline",   label: "Vouchers", sub: "2 active", route: "/vouchers" },
  { icon: "notifications-outline", label: "Notifications", route: "/notifications" },
  { icon: "help-circle-outline", label: "Help center", route: "/help" },
  { icon: "settings-outline", label: "Settings", route: "/settings" },
];

export default function Account() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient
        colors={["#FF6B2C", "#FF8C3A"]}
        style={[s.headerGradient, { paddingTop: insets.top + 18 }]}
      >
        <Text style={s.headerTitle}>Account</Text>
      </LinearGradient>

      <View style={s.signinCard}>
        <View style={s.signinRow}>
          <KafuMark size={56} />
          <View style={{ flex: 1 }}>
            <Text style={s.signinTitle}>Welcome to KafuDeal</Text>
            <Text style={s.signinSub}>Sign in to save deals, track orders & get personalised picks</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/login")} style={s.signinBtn}>
          <Text style={s.signinBtnText}>Sign in or create account</Text>
        </Pressable>
      </View>

      <View style={s.menu}>
        {menu.map((m, i) => (
          <Pressable
            key={i}
            onPress={() => router.push(m.route as any)}
            style={[s.menuItem, i < menu.length - 1 && s.menuItemBorder]}
          >
            <View style={s.menuIcon}>
              <Ionicons name={m.icon} size={18} color="#FF6B2C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>{m.label}</Text>
              {m.sub && <Text style={s.menuSub}>{m.sub}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        ))}
      </View>

      <Text style={s.versionText}>KafuDeal v0.1.0 · UAE</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  headerGradient: {
    paddingHorizontal: 20, paddingBottom: 30,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "white" },
  signinCard: {
    marginHorizontal: 16, marginTop: -16,
    backgroundColor: "white", borderRadius: 16, padding: 18,
    shadowColor: "#0F172A", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 14,
  },
  signinRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  signinTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  signinSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  signinBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 14,
  },
  signinBtnText: { color: "white", fontSize: 14, fontWeight: "800" },
  menu: {
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: "white", borderRadius: 16, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  menuSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  versionText: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 32 },
});
