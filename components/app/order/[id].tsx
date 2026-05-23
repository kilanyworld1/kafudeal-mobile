import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  { emoji: "✓", label: "Confirmed" },
  { emoji: "📦", label: "Preparing" },
  { emoji: "🚚", label: "On the Way" },
  { emoji: "🏠", label: "Delivered" },
];

const ITEMS = [
  { name: "Lindt 85% Dark", qty: 1, price: 9, image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200&q=80" },
  { name: "Al Ain Milk 2L", qty: 2, price: 8, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80" },
  { name: "Nivea Cream", qty: 1, price: 15, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80" },
];

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1); // 0..3

  const driverPulse = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const nowPulse = useRef(new Animated.Value(0)).current;

  // Driver dot pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(driverPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(driverPulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(nowPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(nowPulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / (STEPS.length - 1),
      duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [step]);

  // Auto-advance demo
  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 7500);
    return () => clearTimeout(t);
  }, [step]);

  const progressW = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const driverScale = driverPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const nowScale = nowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const nowOpacity = nowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const stageText =
    step === 0 ? "Order confirmed" :
    step === 1 ? "Preparing your order" :
    step === 2 ? "On the way to you" :
    "Order delivered";
  const stageSub =
    step === 0 ? "Sent to the store" :
    step === 1 ? "Estimated arrival 30–45 min" :
    step === 2 ? "Arriving in ~10 min" :
    "Hope you enjoyed!";
  const stageEmoji =
    step === 0 ? "✅" : step === 1 ? "📦" : step === 2 ? "🚚" : "🎉";

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.replace("/(tabs)/orders")} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.topId}>#{id}</Text>
          <Text style={s.topSub}>Placed 14:23 · 3 items</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Stage card */}
        <View style={s.stageCard}>
          <Text style={{ fontSize: 40 }}>{stageEmoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.stageTitle}>{stageText}</Text>
            <Text style={s.stageSub}>{stageSub}</Text>
          </View>
        </View>

        {/* Tracker */}
        <View style={s.tracker}>
          <View style={s.lineBg} />
          <Animated.View style={[s.lineFill, { width: progressW }]} />
          <View style={s.stepsRow}>
            {STEPS.map((st, i) => {
              const done = i < step;
              const now = i === step;
              const pending = i > step;
              return (
                <View key={i} style={s.stepCol}>
                  <View style={[
                    s.dot,
                    done && s.dotDone,
                    now && s.dotNow,
                  ]}>
                    {now && (
                      <Animated.View
                        style={[
                          s.nowHalo,
                          { transform: [{ scale: nowScale }], opacity: nowOpacity },
                        ]}
                      />
                    )}
                    <Text style={[
                      s.dotEmoji,
                      pending && { opacity: 0.4 },
                    ]}>
                      {done ? "✓" : st.emoji}
                    </Text>
                  </View>
                  <Text style={[s.stepLabel, !pending && s.stepLabelActive]}>
                    {st.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Map mock */}
        <View style={s.mapBox}>
          {/* Grid pattern background */}
          <View style={s.mapGrid}>
            {[...Array(6)].map((_, r) => (
              <View key={r} style={s.mapRow}>
                {[...Array(6)].map((_, c) => (
                  <View key={c} style={s.mapCell} />
                ))}
              </View>
            ))}
          </View>

          {/* Route */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 220" preserveAspectRatio="none">
            <Path
              d="M 110 145 Q 150 90 230 110 Q 290 130 320 70"
              fill="none"
              stroke="rgba(255,107,44,0.6)"
              strokeWidth={3}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </Svg>

          {/* Destination pin */}
          <View style={[s.pin, { right: "16%", top: "10%" }]}>
            <View style={s.pinHead}>
              <Ionicons name="location" size={16} color="white" />
            </View>
          </View>

          {/* Driver dot animated */}
          <Animated.View
            style={[
              s.driverDot,
              { left: "27%", top: "60%", transform: [{ scale: driverScale }] },
            ]}
          >
            <Text style={{ fontSize: 16 }}>🚚</Text>
          </Animated.View>

          {/* Distance chip */}
          <View style={s.distChip}>
            <Ionicons name="navigate" size={12} color="#FF6B2C" />
            <Text style={s.distChipText}>1.2 km away</Text>
          </View>
        </View>

        {/* Driver card */}
        <View style={s.driverCard}>
          <View style={s.driverAvatar}>
            <Text style={s.driverInitial}>A</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.driverName}>Ahmed M. · Your driver</Text>
            <View style={s.starRow}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={s.driverMeta}>4.9 · Honda CB · F-7421</Text>
            </View>
          </View>
          <Pressable style={[s.iconCircle, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="call" size={16} color="#15803D" />
          </Pressable>
          <Pressable style={[s.iconCircle, { backgroundColor: "#FFF1E5", marginLeft: 6 }]}>
            <Ionicons name="chatbubble" size={16} color="#FF6B2C" />
          </Pressable>
        </View>

        {/* Chat with KafuDeal */}
        <Pressable style={s.chatCard}>
          <View style={s.chatIcon}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#FF6B2C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.chatTitle}>Chat with KafuDeal</Text>
            <Text style={s.chatSub}>Available while your order is in progress</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FF6B2C" />
        </Pressable>

        {/* Items */}
        <Text style={s.sectionTitle}>Items</Text>
        <View style={s.itemsCard}>
          {ITEMS.map((it, i) => (
            <View key={i} style={[s.itemRow, i < ITEMS.length - 1 && s.itemRowBorder]}>
              <Image source={{ uri: it.image }} style={s.itemImg} />
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{it.name}</Text>
                <Text style={s.itemMeta}>× {it.qty} · AED {it.price} each</Text>
              </View>
              <Text style={s.itemTotal}>AED {it.price * it.qty}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsCard}>
          <Row label="Subtotal" value="AED 56" />
          <Row label="Voucher (WELCOME10)" value="−AED 5.60" valueColor="#15803D" labelColor="#15803D" />
          <Row label="Delivery" value="AED 12" />
          <View style={s.divider} />
          <Row label="Total paid" value="AED 62.40" big />
        </View>

        {/* Help button */}
        <Pressable style={s.helpBtn}>
          <Ionicons name="help-circle-outline" size={18} color="#FF6B2C" />
          <Text style={s.helpBtnText}>Need help with this order?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({
  label, value, big, valueColor, labelColor,
}: {
  label: string; value: string; big?: boolean;
  valueColor?: string; labelColor?: string;
}) {
  return (
    <View style={s.totalsRow}>
      <Text style={[s.totalsLbl, big && s.totalsLblBig, labelColor && { color: labelColor }]}>
        {label}
      </Text>
      <Text style={[s.totalsVal, big && s.totalsValBig, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  backBtn: { padding: 6 },
  topId: { fontFamily: "Menlo", fontSize: 16, fontWeight: "800", color: "#0F172A" },
  topSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },

  stageCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 16,
    backgroundColor: "#FFF1E5",
    borderWidth: 1, borderColor: "rgba(255,107,44,0.20)",
  },
  stageTitle: { fontSize: 16, fontWeight: "800", color: "#C2410C" },
  stageSub: { fontSize: 12, color: "#9A3412", marginTop: 3 },

  tracker: { marginTop: 22, marginHorizontal: 4, position: "relative", height: 80, justifyContent: "center" },
  lineBg: {
    position: "absolute", top: 22, left: 20, right: 20,
    height: 4, backgroundColor: "#E5E7EB", borderRadius: 2,
  },
  lineFill: {
    position: "absolute", top: 22, left: 20,
    height: 4, backgroundColor: "#FF6B2C", borderRadius: 2,
  },
  stepsRow: { flexDirection: "row", justifyContent: "space-between" },
  stepCol: { alignItems: "center", width: 70 },
  dot: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "white",
    borderWidth: 2, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center",
  },
  dotDone: { backgroundColor: "#FF6B2C", borderColor: "#FF6B2C" },
  dotNow: { backgroundColor: "#FFE7D1", borderColor: "#FF6B2C" },
  dotEmoji: { fontSize: 18 },
  nowHalo: {
    position: "absolute", top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 24, backgroundColor: "#FF6B2C",
  },
  stepLabel: { fontSize: 10.5, color: "#94A3B8", fontWeight: "700", marginTop: 6, textAlign: "center" },
  stepLabelActive: { color: "#0F172A" },

  mapBox: {
    height: 200, borderRadius: 16, marginTop: 18,
    backgroundColor: "#E8F0F8",
    overflow: "hidden", position: "relative",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
  },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  mapRow: { flex: 1, flexDirection: "row" },
  mapCell: {
    flex: 1, borderWidth: 0.5, borderColor: "rgba(15,23,42,0.06)",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  pin: { position: "absolute" },
  pinHead: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#0F172A",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  driverDot: {
    position: "absolute",
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 3, borderColor: "#FF6B2C",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF6B2C", shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  distChip: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "white", borderRadius: 999,
    shadowColor: "#0F172A", shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  distChipText: { fontSize: 11, fontWeight: "800", color: "#0F172A" },

  driverCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "white", borderRadius: 14, padding: 14, marginTop: 14,
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#FF8C3A",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  driverInitial: { color: "white", fontSize: 18, fontWeight: "800" },
  driverName: { fontSize: 13.5, fontWeight: "800", color: "#0F172A" },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  driverMeta: { fontSize: 11, color: "#64748B" },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },

  chatCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "white", borderRadius: 14, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
  },
  chatIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
  },
  chatTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  chatSub: { fontSize: 11.5, color: "#64748B", marginTop: 2 },

  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 22, marginBottom: 10 },
  itemsCard: { backgroundColor: "white", borderRadius: 14, paddingHorizontal: 14 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  itemRowBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  itemImg: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#F1EFE8" },
  itemName: { fontSize: 13.5, fontWeight: "800", color: "#0F172A" },
  itemMeta: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "800", color: "#FF6B2C" },

  totalsCard: { backgroundColor: "white", borderRadius: 14, padding: 16, marginTop: 14 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsLbl: { fontSize: 13, color: "#64748B" },
  totalsLblBig: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  totalsVal: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  totalsValBig: { fontSize: 20, fontWeight: "800", color: "#FF6B2C" },
  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)", marginVertical: 8 },

  helpBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, marginTop: 18,
    borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,107,44,0.30)",
  },
  helpBtnText: { color: "#FF6B2C", fontSize: 13, fontWeight: "800" },
});
