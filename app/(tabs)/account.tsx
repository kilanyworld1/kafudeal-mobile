import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

type MenuItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  sub?: string;
  route?: string;
};

const PRIMARY_MENU: MenuItem[] = [
  { icon: "heart", iconBg: "#FEE2E2", iconColor: "#DC2626", label: "Saved deals", sub: "4 favorites", route: "/saved" },
  { icon: "cube", iconBg: "#FFE7D1", iconColor: "#FF6B2C", label: "Your orders", sub: "1 active", route: "/(tabs)/orders" },
  { icon: "gift", iconBg: "#FCE7F3", iconColor: "#DB2777", label: "Refer a friend", sub: "Get up to AED 50" },
  { icon: "ticket", iconBg: "#DBEAFE", iconColor: "#1D4ED8", label: "Vouchers", sub: "2 active", route: "/vouchers" },
  { icon: "location", iconBg: "#ECFDF5", iconColor: "#15803D", label: "Saved addresses", sub: "2 saved", route: "/addresses" },
];

const SECONDARY_MENU: MenuItem[] = [
  { icon: "star", iconBg: "#EEF2FF", iconColor: "#6366F1", label: "KafuDeal Pro" },
  { icon: "help-circle", iconBg: "#F1F5F9", iconColor: "#334155", label: "Get help", route: "/help" },
  { icon: "settings", iconBg: "#F1F5F9", iconColor: "#334155", label: "Settings", sub: "v0.1.0", route: "/settings" },
];

export default function Account() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header with avatar */}
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>M</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>Mohamed Kilany</Text>
          <Text style={s.country}>🇦🇪 United Arab Emirates</Text>
        </View>
        <Pressable onPress={() => router.push("/settings")} style={s.gearBtn}>
          <Ionicons name="settings-outline" size={20} color="#0F172A" />
        </Pressable>
      </View>

      {/* Impact card */}
      <View style={s.impactCard}>
        <View style={s.impactTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.impactLabel}>YOUR IMPACT THIS MONTH</Text>
            <View style={s.impactAmountRow}>
              <Text style={s.impactAmount}>AED 487</Text>
              <Text style={s.impactSaved}>saved</Text>
            </View>
          </View>
          <View style={s.impactEmojiBox}>
            <Text style={{ fontSize: 28 }}>📊</Text>
          </View>
        </View>
        <View style={s.impactStats}>
          <View style={s.impactStat}>
            <Text style={s.impactStatNum}>12 kg</Text>
            <Text style={s.impactStatLbl}>rescued from landfill</Text>
          </View>
          <View style={s.impactDivider} />
          <View style={s.impactStat}>
            <Text style={s.impactStatNum}>34</Text>
            <Text style={s.impactStatLbl}>items saved</Text>
          </View>
        </View>
      </View>

      {/* Pro banner */}
      <Pressable style={s.proBanner}>
        <View style={{ flex: 1 }}>
          <Text style={s.proBannerTitle}>Free delivery for the whole family</Text>
          <Text style={s.proBannerSub}>Plus exclusive deals + early access to new drops</Text>
          <Text style={s.proBannerCta}>Try KafuDeal Pro free →</Text>
        </View>
        <Text style={{ fontSize: 38 }}>⭐</Text>
      </Pressable>

      {/* Primary menu */}
      <View style={s.menuGroup}>
        {PRIMARY_MENU.map((m, i) => (
          <Pressable
            key={i}
            onPress={() => m.route && router.push(m.route as any)}
            style={[s.menuItem, i < PRIMARY_MENU.length - 1 && s.menuItemBorder]}
          >
            <View style={[s.menuIcon, { backgroundColor: m.iconBg }]}>
              <Ionicons name={m.icon as any} size={18} color={m.iconColor} />
            </View>
            <Text style={s.menuLabel}>{m.label}</Text>
            {m.sub && <Text style={s.menuMeta}>{m.sub}</Text>}
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        ))}
      </View>

      {/* Secondary menu */}
      <View style={s.menuGroup}>
        {SECONDARY_MENU.map((m, i) => (
          <Pressable
            key={i}
            onPress={() => m.route && router.push(m.route as any)}
            style={[s.menuItem, i < SECONDARY_MENU.length - 1 && s.menuItemBorder]}
          >
            <View style={[s.menuIcon, { backgroundColor: m.iconBg }]}>
              <Ionicons name={m.icon as any} size={18} color={m.iconColor} />
            </View>
            <Text style={s.menuLabel}>{m.label}</Text>
            {m.sub && <Text style={s.menuMeta}>{m.sub}</Text>}
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        ))}
      </View>

      {/* Sign out */}
      <Pressable
        onPress={() => router.push("/login")}
        style={s.signOutBtn}
      >
        <Text style={s.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={s.versionText}>KafuDeal v0.1.0 · UAE</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFF9F2",
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#FF6B2C",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF6B2C", shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
    elevation: 4,
  },
  avatarText: { color: "white", fontSize: 26, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  country: { fontSize: 12, color: "#64748B", marginTop: 2 },
  gearBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
  },

  impactCard: {
    marginHorizontal: 16, marginTop: 4,
    backgroundColor: "white", borderRadius: 18, padding: 18,
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  impactTop: { flexDirection: "row", alignItems: "center" },
  impactLabel: { fontSize: 10.5, color: "#94A3B8", fontWeight: "800", letterSpacing: 0.5 },
  impactAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 },
  impactAmount: { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  impactSaved: { fontSize: 14, color: "#64748B", fontWeight: "700" },
  impactEmojiBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  impactStats: {
    flexDirection: "row", alignItems: "center",
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.06)",
  },
  impactStat: { flex: 1, alignItems: "center" },
  impactStatNum: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  impactStatLbl: { fontSize: 11, color: "#64748B", marginTop: 2, textAlign: "center" },
  impactDivider: { width: 1, height: 30, backgroundColor: "rgba(15,23,42,0.10)" },

  proBanner: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: "#0F172A",
    borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  proBannerTitle: { color: "white", fontSize: 15, fontWeight: "800" },
  proBannerSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 3 },
  proBannerCta: { color: "#FFC857", fontSize: 13, fontWeight: "800", marginTop: 8 },

  menuGroup: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: "white", borderRadius: 16, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0F172A" },
  menuMeta: { fontSize: 11.5, color: "#94A3B8", marginRight: 6 },

  signOutBtn: {
    marginHorizontal: 16, marginTop: 22,
    backgroundColor: "white",
    paddingVertical: 14, borderRadius: 14,
    alignItems: "center",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.08)",
  },
  signOutText: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  versionText: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 16 },
});
