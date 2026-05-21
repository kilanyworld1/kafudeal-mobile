import { useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import KafuMark from "../components/KafuMark";

export default function Splash() {
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const haloRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade + scale in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle float (loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Halo spin (loop)
    Animated.loop(
      Animated.timing(haloRotate, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const t = setTimeout(() => router.replace("/(tabs)"), 2400);
    return () => clearTimeout(t);
  }, []);

  const haloSpin = haloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={["#FF6B2C", "#FF8C3A", "#FFA45E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Spinning halo behind the logo */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.halo,
          { transform: [{ rotate: haloSpin }] },
        ]}
      />

      {/* Skip */}
      <Pressable
        onPress={() => router.replace("/(tabs)")}
        style={s.skipBtn}
      >
        <Text style={s.skipText}>Skip →</Text>
      </Pressable>

      <View style={s.center}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: float }],
          }}
        >
          <View style={s.logoShadow}>
            <KafuMark size={160} variant="white" />
          </View>
        </Animated.View>

        <Text style={s.title}>
          Kafu<Text style={s.titleAccent}>Deal</Text>
        </Text>

        <Text style={s.tagline}>
          Save up to 70% on groceries about to expire
        </Text>

        <ActivityIndicator color="white" style={{ marginTop: 40 }} />

        {/* Trust strip */}
        <View style={s.trustStrip}>
          {[
            { num: "−70%", lbl: "OFF" },
            { num: "2h", lbl: "DELIVERY" },
            { num: "100%", lbl: "VERIFIED" },
          ].map((t, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={s.trustNum}>{t.num}</Text>
              <Text style={s.trustLbl}>{t.lbl}</Text>
            </View>
          ))}
        </View>

        <Text style={s.footer}>
          FRESH STOCK · UAE STORES · DAILY DROPS
        </Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  halo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
    borderRadius: 150,
    borderWidth: 24,
    borderColor: "rgba(255,255,255,0.15)",
    opacity: 0.6,
  },
  skipBtn: {
    position: "absolute",
    top: 60,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    zIndex: 10,
  },
  skipText: { color: "white", fontWeight: "800", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logoShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: "800",
    color: "white",
    letterSpacing: -1.8,
    marginTop: 28,
  },
  titleAccent: { color: "#0B1020" },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 320,
  },
  trustStrip: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  trustNum: { color: "white", fontSize: 18, fontWeight: "800" },
  trustLbl: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
