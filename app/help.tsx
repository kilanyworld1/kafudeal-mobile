import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { openCrispChat } from "../lib/crisp";

export default function Help() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  const topics = [
    { icon: "cube-outline" as const, label: t("help.topic_my_orders"), sub: t("help.topic_orders_sub") },
    { icon: "card-outline" as const, label: t("help.topic_payments") },
    { icon: "location-outline" as const, label: t("help.topic_delivery") },
    { icon: "leaf-outline" as const, label: t("help.topic_food_safety") },
    { icon: "ticket-outline" as const, label: t("help.topic_vouchers") },
    { icon: "person-outline" as const, label: t("help.topic_account") },
  ];

  const faqs = [
    { q: t("help.faq_safe_q"), a: t("help.faq_safe_a") },
    { q: t("help.faq_wrong_q"), a: t("help.faq_wrong_a") },
    { q: t("help.faq_fast_q"), a: t("help.faq_fast_a") },
    { q: t("help.faq_areas_q"), a: t("help.faq_areas_a") },
  ];

  const backStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] as any } : undefined;
  const chevronStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] as any } : undefined;

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" style={backStyle} />
        </Pressable>
        <Text style={s.topTitle}>{t("help.help_center")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <View style={s.contactRow}>
          <Pressable
            onPress={openCrispChat}
            style={[s.contactCard, { backgroundColor: "#FF6B2C" }]}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="white" />
            <Text style={s.contactTitle}>{t("help.chat_with_us")}</Text>
            <Text style={s.contactSub}>{t("help.chat_with_us_avg")}</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("tel:+9718005238")}
            style={[s.contactCard, { backgroundColor: "white" }]}
          >
            <Ionicons name="call" size={22} color="#FF6B2C" />
            <Text style={[s.contactTitle, { color: "#0F172A" }]}>{t("help.call_us")}</Text>
            <Text style={[s.contactSub, { color: "#64748B" }]}>{t("help.call_number")}</Text>
          </Pressable>
        </View>

        <Text style={s.section}>{t("help.browse_topics")}</Text>
        <View style={s.topics}>
          {topics.map((tp, i) => (
            <Pressable key={i} style={[s.topic, i < topics.length - 1 && s.topicBorder]}>
              <View style={s.topicIcon}>
                <Ionicons name={tp.icon} size={18} color="#FF6B2C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.topicLabel}>{tp.label}</Text>
                {tp.sub && <Text style={s.topicSub}>{tp.sub}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={chevronStyle} />
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>{t("help.frequently_asked")}</Text>
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
          <Text style={s.footerTitle}>{t("help.still_need_help")}</Text>
          <Text style={s.footerSub}>{t("help.team_online")}</Text>
          <Pressable onPress={openCrispChat} style={s.footerBtn}>
            <Text style={s.footerBtnText}>{t("help.start_chat")}</Text>
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
  faqQ: { flex: 1, fontSize: 13.5, fontWeight: "700", color: "#0F172A", marginEnd: 12 },
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
