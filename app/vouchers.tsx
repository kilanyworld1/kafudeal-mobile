import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const vouchers = [
  {
    id: "v1", code: "KAFU10",
    title: "10 AED off your next order",
    sub: "Min spend AED 50 · Expires in 5 days",
    color: "#FF6B2C", tag: "ACTIVE", tagColor: "#16A34A",
  },
  {
    id: "v2", code: "FRESH20",
    title: "20% off Fresh & Dairy",
    sub: "Min spend AED 30 · Expires Jun 1",
    color: "#16A34A", tag: "ACTIVE", tagColor: "#16A34A",
  },
  {
    id: "v3", code: "WELCOME15",
    title: "AED 15 off first order",
    sub: "Used on 12 May 2026",
    color: "#94A3B8", tag: "USED", tagColor: "#94A3B8", used: true,
  },
];

export default function Vouchers() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (c: string) => {
    setCopied(c);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Vouchers</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Redeem code */}
        <Text style={s.section}>REDEEM A CODE</Text>
        <View style={s.redeemRow}>
          <TextInput
            value={code} onChangeText={setCode}
            placeholder="Enter voucher code"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            style={s.redeemInput}
          />
          <Pressable style={s.redeemBtn}>
            <Text style={s.redeemBtnText}>Redeem</Text>
          </Pressable>
        </View>

        <Text style={[s.section, { marginTop: 24 }]}>YOUR VOUCHERS</Text>

        {vouchers.map((v) => (
          <View key={v.id} style={[s.voucher, v.used && { opacity: 0.6 }]}>
            <View style={[s.voucherLeft, { backgroundColor: v.color }]}>
              <Ionicons name="ticket" size={28} color="white" />
            </View>
            <View style={s.voucherDivider}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={s.notch} />
              ))}
            </View>
            <View style={s.voucherBody}>
              <View style={s.codeRow}>
                <Text style={s.code}>{v.code}</Text>
                <View style={[s.tag, { backgroundColor: v.tagColor + "20" }]}>
                  <Text style={[s.tagText, { color: v.tagColor }]}>{v.tag}</Text>
                </View>
              </View>
              <Text style={s.voucherTitle}>{v.title}</Text>
              <Text style={s.voucherSub}>{v.sub}</Text>
              {!v.used && (
                <Pressable onPress={() => copy(v.code)} style={s.copyBtn}>
                  <Ionicons name={copied === v.code ? "checkmark" : "copy-outline"} size={14} color="#FF6B2C" />
                  <Text style={s.copyText}>{copied === v.code ? "Copied!" : "Copy code"}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#1D4ED8" />
          <Text style={s.infoText}>
            Apply vouchers at checkout. One voucher per order.
          </Text>
        </View>
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
  section: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginBottom: 10 },
  redeemRow: { flexDirection: "row", gap: 8 },
  redeemInput: {
    flex: 1, backgroundColor: "white",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#0F172A", letterSpacing: 1,
  },
  redeemBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 12,
    paddingHorizontal: 20, alignItems: "center", justifyContent: "center",
  },
  redeemBtnText: { color: "white", fontSize: 13, fontWeight: "800" },
  voucher: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 14, marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  voucherLeft: {
    width: 64, alignItems: "center", justifyContent: "center",
  },
  voucherDivider: {
    justifyContent: "space-around", paddingVertical: 4,
  },
  notch: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFF9F2" },
  voucherBody: { flex: 1, padding: 14 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  code: { fontSize: 14, fontWeight: "800", color: "#0F172A", letterSpacing: 1, fontFamily: "Menlo" },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  voucherTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 6 },
  voucherSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", marginTop: 8,
  },
  copyText: { color: "#FF6B2C", fontSize: 12, fontWeight: "800" },
  infoCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    backgroundColor: "#EAF3FF", padding: 14, borderRadius: 12, marginTop: 12,
  },
  infoText: { color: "#1E3A8A", fontSize: 12, flex: 1 },
});
