import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const topics = [
  { icon: "cube-outline" as const, label: "My orders", sub: "Track, modify, return" },
  { icon: "card-outline" as const, label: "Payments & refunds" },
  { icon: "location-outline" as const, label: "Delivery & addresses" },
  { icon: "leaf-outline" as const, label: "Food safety & expiry" },
  { icon: "ticket-outline" as const, label: "Vouchers & promotions" },
  { icon: "person-outline" as const, label: "Account & settings" },
];

const faqs = [
  {
    q: "Are near-expiry products safe to eat?",
    a: "Yes. All items on KafuDeal are within their stated 'best before' or 'use by' date and have passed our verified-store quality check. We never sell items past their safety date.",
  },
  {
    q: "What if my order is wrong or damaged?",
    a: "Tap 'Need help' on the order page within 24 hours of delivery. We'll refund or replace any item that doesn't match the listing.",
  },
  {
    q: "How fast is delivery?",
    a: "Express slots arrive within 2 hours. Scheduled slots can be picked at checkout.",
  },
  {
    q: "Which areas do you deliver to?",
    a: "Currently Dubai (Marina, JLT, Downtown, Business Bay). Expanding to Abu Dhabi and Sharjah soon.",
  },
];

export default function Help() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Help center</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Quick contact */}
        <View style={s.contactRow}>
          <Pressable style={[s.contactCard, { backgroundColor: "#FF6B2C" }]}>
            <Ionicons name="chatbubble-ellipses" size={22} color="white" />
            <Text style={s.contactTitle}>Chat with us</Text>
            <Text style={s.contactSub}>Avg reply &lt; 2 min</Text>
          </Pressable>
          <Pressable style={[s.contactCard, { backgroundColor: "white" }]}>
            <Ionicons name="call" size={22} color="#FF6B2C" />
            <Text style={[s.contactTitle, { color: "#0F172A" }]}>Call us</Text>
            <Text style={[s.contactSub, { color: "#64748B" }]}>+971 800 KAFU</Text>
          </Pressable>
        </View>

        <Text style={s.section}>BROWSE TOPICS</Text>
        <View style={s.topics}>
          {topics.map((t, i) => (
            <Pressable key={i} style={[s.topic, i < topics.length - 1 && s.topicBorder]}>
              <View style={s.topicIcon}>
                <Ionicons name={t.icon} size={18} color="#FF6B2C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.topicLabel}>{t.label}</Text>
                {t.sub && <Text style={s.topicSub}>{t.sub}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>FREQUENTLY ASKED</Text>
        <View style={s.faqList}>
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Pressable
                key={i}
                onPress={() => setOpen(isOpen ? null : i)}
                style={[s.faq, i < faqs.length - 1 && s.faqBorder]}
              >
                <View style={s.faqRow}>
                  <Text style={s.faqQ}>{f.q}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18} color="#64748B"
                  />
                </View>
                {isOpen && <Text style={s.faqA}>{f.a}</Text>}
              </Pressable>
            );
          })}
        </View>

        <View style={s.footerCard}>
          <Text style={s.footerTitle}>Still need help?</Text>
          <Text style={s.footerSub}>Our team is online 7 days a week.</Text>
          <Pressable style={s.footerBtn}>
            <Text style={s.footerBtnText}>Start a chat</Text>
          </Pressable>
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
  contactRow: { flexDirection: "row", gap: 10 },
  contactCard: {
    flex: 1, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
  },
  contactTitle: { color: "white", fontSize: 15, fontWeight: "800", marginTop: 10 },
  contactSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  section: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  topics: { backgroundColor: "white", borderRadius: 14, overflow: "hidden" },
  topic: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  topicBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  topicIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  topicLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  topicSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  faqList: { backgroundColor: "white", borderRadius: 14, overflow: "hidden" },
  faq: { padding: 14 },
  faqBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  faqRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQ: { flex: 1, fontSize: 13.5, fontWeight: "700", color: "#0F172A", marginRight: 12 },
  faqA: { fontSize: 12.5, color: "#475569", marginTop: 8, lineHeight: 19 },
  footerCard: {
    marginTop: 24,
    backgroundColor: "white", borderRadius: 14, padding: 18,
    alignItems: "center",
  },
  footerTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  footerSub: { fontSize: 12.5, color: "#64748B", marginTop: 4 },
  footerBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 14,
  },
  footerBtnText: { color: "white", fontSize: 13, fontWeight: "800" },
});
