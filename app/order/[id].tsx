import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const STEPS = [
  { key: "confirmed", label: "Order confirmed", sub: "We received your order", icon: "checkmark-circle" as const },
  { key: "preparing", label: "Preparing", sub: "Store is packing your items", icon: "cube" as const },
  { key: "onway",     label: "On the way",  sub: "Rider is heading to you",  icon: "bicycle" as const },
  { key: "delivered", label: "Delivered",   sub: "Enjoy your order!",        icon: "home" as const },
];

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1); // 0=confirmed, 1=preparing, 2=onway, 3=delivered
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Pulse animation on current step
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progress, {
      toValue: step / (STEPS.length - 1),
      duration: 600,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [step]);

  // Auto-advance steps for demo
  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 6500);
    return () => clearTimeout(t);
  }, [step]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const eta = step === 3 ? "Delivered" : step === 2 ? "Arriving in ~10 min" : step === 1 ? "Arriving in ~35 min" : "Arriving in ~55 min";

  return (
    <View style={s.root}>
      <LinearGradient colors={["#FF6B2C", "#FF8C3A"]} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.replace("/(tabs)/orders")} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="white" />
          </Pressable>
          <Text style={s.topTitle}>Order #{id}</Text>
          <Pressable style={s.backBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
          </Pressable>
        </View>

        <View style={s.etaBlock}>
          <Text style={s.etaLabel}>ESTIMATED ARRIVAL</Text>
          <Text style={s.etaTime}>{eta}</Text>
          {step < 3 && (
            <Text style={s.etaSub}>You'll get a notification on each update</Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth }]} />
        </View>

        {/* Steps */}
        <View style={{ marginTop: 24 }}>
          {STEPS.map((st, i) => {
            const done = i < step;
            const current = i === step;
            const pending = i > step;
            return (
              <View key={st.key} style={s.stepRow}>
                <View style={s.stepLine}>
                  <View
                    style={[
                      s.stepDot,
                      done && s.stepDotDone,
                      current && s.stepDotCurrent,
                    ]}
                  >
                    {current && (
                      <Animated.View
                        style={[
                          s.stepPulse,
                          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                        ]}
                      />
                    )}
                    <Ionicons
                      name={done || current ? st.icon : st.icon}
                      size={18}
                      color={pending ? "#CBD5E1" : "white"}
                    />
                  </View>
                  {i < STEPS.length - 1 && (
                    <View
                      style={[
                        s.stepConnector,
                        i < step && { backgroundColor: "#FF6B2C" },
                      ]}
                    />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: 24 }}>
                  <Text
                    style={[
                      s.stepLabel,
                      pending && { color: "#94A3B8" },
                      current && { color: "#FF6B2C" },
                    ]}
                  >
                    {st.label}
                  </Text>
                  <Text style={[s.stepSub, pending && { color: "#CBD5E1" }]}>{st.sub}</Text>
                  {current && (
                    <View style={s.currentBadge}>
                      <View style={s.liveDot} />
                      <Text style={s.currentBadgeText}>LIVE</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Rider card */}
        {step >= 2 && step < 3 && (
          <View style={s.riderCard}>
            <View style={s.riderAvatar}>
              <Ionicons name="person" size={24} color="#FF6B2C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.riderName}>Ahmed K.</Text>
              <View style={s.starRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={s.starText}>4.9 · 1,240 deliveries</Text>
              </View>
            </View>
            <Pressable style={s.callBtn}>
              <Ionicons name="call" size={18} color="white" />
            </Pressable>
            <Pressable style={[s.callBtn, { backgroundColor: "#F1EFE8", marginLeft: 8 }]}>
              <Ionicons name="chatbubble" size={18} color="#0F172A" />
            </Pressable>
          </View>
        )}

        {/* Delivery details */}
        <Text style={s.sectionTitle}>Delivery to</Text>
        <View style={s.card}>
          <View style={s.cardRow}>
            <Ionicons name="location-sharp" size={20} color="#FF6B2C" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.addrLabel}>Home</Text>
              <Text style={s.addrLine}>Marina Towers, Tower 3, Apt 1402</Text>
              <Text style={s.addrArea}>Dubai Marina · JLT</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Payment</Text>
        <View style={s.card}>
          <View style={s.cardRow}>
            <Ionicons name="card-outline" size={20} color="#0F172A" />
            <Text style={[s.addrLabel, { marginLeft: 10, flex: 1 }]}>Visa ending in 4242</Text>
            <Text style={s.payTotal}>AED 35.00</Text>
          </View>
        </View>

        <Pressable style={s.helpBtn}>
          <Ionicons name="help-circle-outline" size={18} color="#FF6B2C" />
          <Text style={s.helpBtnText}>Need help with this order?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    paddingHorizontal: 16, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center", justifyContent: "center",
  },
  topTitle: { color: "white", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  etaBlock: { marginTop: 18, alignItems: "center" },
  etaLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  etaTime: { color: "white", fontSize: 24, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  etaSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 },
  progressTrack: {
    height: 6, backgroundColor: "#E5E5E5", borderRadius: 3, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FF6B2C", borderRadius: 3 },
  stepRow: { flexDirection: "row", alignItems: "flex-start" },
  stepLine: { width: 40, alignItems: "center" },
  stepDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#E5E5E5",
    alignItems: "center", justifyContent: "center",
  },
  stepDotDone: { backgroundColor: "#FF6B2C" },
  stepDotCurrent: { backgroundColor: "#FF6B2C" },
  stepPulse: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18, backgroundColor: "#FF6B2C",
  },
  stepConnector: {
    width: 2, flex: 1, minHeight: 30,
    backgroundColor: "#E5E5E5", marginTop: 2,
  },
  stepLabel: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  stepSub: { fontSize: 12.5, color: "#64748B", marginTop: 2 },
  currentBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", marginTop: 6,
    backgroundColor: "#FFE7D1",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF6B2C" },
  currentBadgeText: { color: "#854F0B", fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5 },
  riderCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "white", borderRadius: 14, padding: 14,
    marginTop: 8,
    shadowColor: "#0F172A", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  riderAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  riderName: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  starText: { fontSize: 11.5, color: "#64748B" },
  callBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#FF6B2C",
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: "white", borderRadius: 14, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  addrLabel: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  addrLine: { fontSize: 13, color: "#334155", marginTop: 2 },
  addrArea: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  payTotal: { fontSize: 14, fontWeight: "800", color: "#FF6B2C" },
  helpBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, marginTop: 18,
    borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,107,44,0.30)",
  },
  helpBtnText: { color: "#FF6B2C", fontSize: 13, fontWeight: "800" },
});
