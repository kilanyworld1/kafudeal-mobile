import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";
import { addressesAPI } from "../../lib/api";

type MenuItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  sub?: string;
  route?: string;
};

export default function Account() {
  const insets = useSafeAreaInsets();
  const { user, customer, signOut } = useAuth();
  const { saved } = useCart();
  const [addressCount, setAddressCount] = useState<number>(0);

  // Keep the address count fresh — re-fetch every time the Account tab is
  // focused so adding/deleting an address elsewhere reflects here too.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!customer?.id) {
          if (alive) setAddressCount(0);
          return;
        }
        const { data } = await addressesAPI.list();
        if (alive) setAddressCount((data || []).length);
      })();
      return () => {
        alive = false;
      };
    }, [customer?.id])
  );

  const isLoggedIn = !!user;
  const displayName =
    customer?.fullName ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Guest";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    "";
  const initial = displayName.charAt(0).toUpperCase();

  const PRIMARY_MENU: MenuItem[] = [
    { icon: "heart", iconBg: "#FEE2E2", iconColor: "#DC2626",
      label: "Saved deals", sub: `${saved.length} ${saved.length === 1 ? "favorite" : "favorites"}`,
      route: "/saved" },
    { icon: "cube", iconBg: "#FFE7D1", iconColor: "#FF6B2C",
      label: "Your orders", route: "/(tabs)/orders" },
    { icon: "ticket", iconBg: "#DBEAFE", iconColor: "#1D4ED8",
      label: "Vouchers", sub: "2 active", route: "/vouchers" },
    { icon: "location", iconBg: "#ECFDF5", iconColor: "#15803D",
      label: "Saved addresses",
      sub: `${addressCount} ${addressCount === 1 ? "saved" : "saved"}`,
      route: "/addresses" },
  ];

  const SECONDARY_MENU: MenuItem[] = [
    { icon: "help-circle", iconBg: "#F1F5F9", iconColor: "#334155",
      label: "Get help", route: "/help" },
    { icon: "settings", iconBg: "#F1F5F9", iconColor: "#334155",
      label: "Settings", route: "/settings" },
  ];

  const openIG = () => {
    Linking.openURL("https://www.instagram.com/kafudeal").catch(() => {});
  };

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => isLoggedIn ? null : router.push("/login")} style={s.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarText}>{initial}</Text>
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{displayName}</Text>
            <Text style={s.country}>
              {isLoggedIn ? (user?.email || "🇦🇪 United Arab Emirates") : "Not signed in"}
            </Text>
          </View>
          {isLoggedIn && (
            <Pressable onPress={() => router.push("/settings")} style={s.gearBtn}>
              <Ionicons name="settings-outline" size={20} color="#0F172A" />
            </Pressable>
          )}
        </View>

        {/* Sign-in CTA if not logged in */}
        {!isLoggedIn && (
          <Pressable onPress={() => router.push("/login")} style={s.signinCard}>
            <View style={s.signinIcon}>
              <Ionicons name="person" size={22} color="#FF6B2C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.signinTitle}>Sign in to KafuDeal</Text>
              <Text style={s.signinSub}>Save deals, track orders & sync across devices</Text>
            </View>
            <View style={s.signinBtn}>
              <Text style={s.signinBtnText}>Sign in</Text>
            </View>
          </Pressable>
        )}

        {/* Primary menu */}
        <View style={[s.menuGroup, { marginTop: isLoggedIn ? 20 : 14 }]}>
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
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </Pressable>
          ))}
        </View>

        {/* Follow us on Instagram */}
        <Pressable onPress={openIG} style={s.igCard}>
          <View style={s.igIcon}>
            <Ionicons name="logo-instagram" size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.igTitle}>Follow us on Instagram</Text>
            <Text style={s.igSub}>@kafudeal · Daily drops, behind the scenes</Text>
          </View>
          <Ionicons name="open-outline" size={18} color="#FF6B2C" />
        </Pressable>

        {/* Sign in / Sign out */}
        {isLoggedIn && (
          <Pressable
            onPress={async () => { await signOut(); }}
            style={s.signOutBtn}
          >
            <Text style={s.signOutText}>Sign out</Text>
          </Pressable>
        )}

        <Text style={s.versionText}>KafuDeal v0.4.0 · UAE</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FF6B2C",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF6B2C", shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
    elevation: 4,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: "white", fontSize: 24, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  country: { fontSize: 12, color: "#64748B", marginTop: 2 },
  gearBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
  },
  signinCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: "white", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  signinIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  signinTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  signinSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  signinBtn: {
    backgroundColor: "#FF6B2C",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  signinBtnText: { color: "white", fontSize: 12, fontWeight: "800" },
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
  igCard: {
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: "white", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "rgba(255,107,44,0.18)",
  },
  igIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    // Instagram-ish gradient feel via solid orange (RN solid stay simple)
    backgroundColor: "#E1306C",
  },
  igTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  igSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  signOutBtn: {
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: "white",
    paddingVertical: 13, borderRadius: 14,
    alignItems: "center",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.08)",
  },
  signOutText: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  versionText: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 14 },
});
