import { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [pushOrder, setPushOrder] = useState(true);
  const [pushDeals, setPushDeals] = useState(true);
  const [pushNews, setPushNews] = useState(false);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [biometric, setBiometric] = useState(true);

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Account */}
        <Text style={s.section}>ACCOUNT</Text>
        <View style={s.group}>
          <Row icon="person-outline" label="Personal info" />
          <Row icon="lock-closed-outline" label="Password & security" />
          <Row icon="finger-print-outline" label="Use biometric login" toggle value={biometric} onChange={setBiometric} last />
        </View>

        {/* Notifications */}
        <Text style={s.section}>NOTIFICATIONS</Text>
        <View style={s.group}>
          <Row icon="cube-outline" label="Order updates" toggle value={pushOrder} onChange={setPushOrder} />
          <Row icon="flame-outline" label="Flash deals & offers" toggle value={pushDeals} onChange={setPushDeals} />
          <Row icon="newspaper-outline" label="News & tips" toggle value={pushNews} onChange={setPushNews} last />
        </View>

        <Text style={s.section}>EMAIL & SMS</Text>
        <View style={s.group}>
          <Row icon="mail-outline" label="Email updates" toggle value={email} onChange={setEmail} />
          <Row icon="chatbubble-outline" label="SMS updates" toggle value={sms} onChange={setSms} last />
        </View>

        {/* Preferences */}
        <Text style={s.section}>PREFERENCES</Text>
        <View style={s.group}>
          <Row icon="language-outline" label="Language" value2="English" />
          <Row icon="cash-outline" label="Currency" value2="AED" />
          <Row icon="moon-outline" label="Theme" value2="Light" last />
        </View>

        {/* Legal */}
        <Text style={s.section}>LEGAL</Text>
        <View style={s.group}>
          <Row icon="document-text-outline" label="Terms of service" />
          <Row icon="shield-outline" label="Privacy policy" />
          <Row icon="information-circle-outline" label="About KafuDeal" value2="v0.1.0" last />
        </View>

        <Pressable style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={s.logoutText}>Sign out</Text>
        </Pressable>

        <Text style={s.footer}>Made with 💛 in the UAE</Text>
      </ScrollView>
    </View>
  );
}

function Row({
  icon, label, toggle, value, onChange, value2, last,
}: {
  icon: any; label: string;
  toggle?: boolean; value?: boolean; onChange?: (v: boolean) => void;
  value2?: string; last?: boolean;
}) {
  return (
    <Pressable style={[s.row, !last && s.rowBorder]}>
      <Ionicons name={icon} size={20} color="#64748B" style={{ marginRight: 14 }} />
      <Text style={s.rowLabel}>{label}</Text>
      {toggle ? (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#CBD5E1", true: "#FFC4A0" }}
          thumbColor={value ? "#FF6B2C" : "#F1F5F9"}
        />
      ) : value2 ? (
        <>
          <Text style={s.rowValue}>{value2}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      )}
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
  section: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginTop: 22, marginBottom: 10, paddingHorizontal: 20 },
  group: { backgroundColor: "white", marginHorizontal: 16, borderRadius: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  rowLabel: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "600" },
  rowValue: { fontSize: 13, color: "#64748B", marginRight: 6 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 24, padding: 14,
    backgroundColor: "white", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(220,38,38,0.20)",
  },
  logoutText: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  footer: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 24 },
});
