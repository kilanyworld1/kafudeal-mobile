import { useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KafuMark from "../components/KafuMark";

const EMOJIS = [
  { e: "🛒", top: 24, left: "18%" as const, delay: 0 },
  { e: "🍫", top: 36, right: "20%" as const, delay: 300 },
  { e: "🥛", top: 102, left: "32%" as const, delay: 600 },
  { e: "🥐", top: 118, right: "28%" as const, delay: 900 },
  { e: "🛍️", top: 168, left: "44%" as const, delay: 1200, size: 50 },
];

export default function Login() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <LinearGradient colors={["#FF6B2C", "#FF8C3A"]} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={20} color="white" />
        </Pressable>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={{ alignItems: "center", marginTop: -64 }}>
            <View style={s.logoCircle}>
              <KafuMark size={66} variant="color" />
            </View>
            <WelcomeTitle />
            <Text style={s.sub}>Sign in to track orders and save vouchers</Text>
          </View>

          {/* Animated emoji stage */}
          <View style={s.emojiStage}>
            {EMOJIS.map((it, i) => (
              <FloatingEmoji
                key={i}
                emoji={it.e}
                top={it.top}
                left={(it as any).left}
                right={(it as any).right}
                delay={it.delay}
                size={(it as any).size || 38}
              />
            ))}
          </View>

          {/* Social buttons */}
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={[s.socialBtn, { backgroundColor: "#000000" }]}
          >
            <AppleLogo />
            <Text style={[s.socialText, { color: "white" }]}>Continue with Apple</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={[s.socialBtn, s.socialBtnOutline]}
          >
            <GoogleLogo />
            <Text style={s.socialText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={[s.socialBtn, { backgroundColor: "#1877F2" }]}
          >
            <FacebookLogo />
            <Text style={[s.socialText, { color: "white" }]}>Continue with Facebook</Text>
          </Pressable>

          <Text style={s.terms}>
            By continuing you agree to our{"\n"}
            <Text style={s.termsLink}>Terms</Text> and <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function WelcomeTitle() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.Text style={[s.welcome, { opacity, transform: [{ translateY }] }]}>
      Welcome back!
    </Animated.Text>
  );
}

function FloatingEmoji({
  emoji, top, left, right, delay, size,
}: { emoji: string; top: number; left?: any; right?: any; delay: number; size: number }) {
  const float = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", top, left, right,
        opacity, transform: [{ scale }, { translateY: float }],
      }}
    >
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}

function AppleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
      <Path d="M17.5 12.5c0-3 2.4-5.5 5.5-5.5-1.6-2.4-4.4-4-7.5-4-2 0-3.9.7-5.4 1.9-1.5-1.2-3.4-1.9-5.4-1.9C2.4 3 0 5.5 0 8.5c0 4.7 5.6 11.4 9 14.5 1.4 1.3 3.6 1.3 5 0 .8-.7 1.7-1.6 2.6-2.6-1.4-2.5-2.1-5.3-2.1-7.9z" />
    </Svg>
  );
}

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h6c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8z" />
      <Path fill="#34A853" d="M12 23c2.9 0 5.4-.9 7.2-2.6l-3.6-2.8c-1 .6-2.2 1-3.6 1-2.7 0-5-1.8-5.9-4.3H2.4v2.8C4.3 20.7 7.9 23 12 23z" />
      <Path fill="#FBBC05" d="M6.1 14.3c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H2.4C1.5 9 1 10.4 1 12s.5 3 1.4 4.5l3.7-2.2z" />
      <Path fill="#EA4335" d="M12 5.6c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.4 14.9 1 12 1 7.9 1 4.3 3.3 2.4 6.5l3.7 2.8c.9-2.5 3.2-4.3 5.9-4.3z" />
    </Svg>
  );
}

function FacebookLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
      <Path d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85V15.47H7.08V12h3.05V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.52c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z" />
    </Svg>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    height: 130,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 18,
    flexDirection: "row", justifyContent: "flex-end",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center", justifyContent: "center",
  },
  card: {
    marginHorizontal: 16, marginTop: -34,
    backgroundColor: "white", borderRadius: 24,
    padding: 22, paddingTop: 0,
    shadowColor: "#0F172A", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 22,
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "white",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF6B2C", shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 20,
    elevation: 6,
    borderWidth: 4, borderColor: "#FFE7D1",
  },
  welcome: {
    fontSize: 26, fontWeight: "800", color: "#0F172A",
    marginTop: 18, letterSpacing: -0.5,
  },
  sub: { fontSize: 13.5, color: "#64748B", marginTop: 6, textAlign: "center", paddingHorizontal: 20 },
  emojiStage: { height: 230, position: "relative", marginTop: 8 },
  socialBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 15, borderRadius: 14, marginBottom: 10,
  },
  socialBtnOutline: {
    backgroundColor: "white",
    borderWidth: 1.5, borderColor: "rgba(15,23,42,0.12)",
  },
  socialText: { fontSize: 14.5, fontWeight: "800", color: "#0F172A" },
  terms: {
    textAlign: "center", color: "#94A3B8",
    fontSize: 11.5, marginTop: 20, lineHeight: 18,
  },
  termsLink: { color: "#FF6B2C", fontWeight: "800" },
});
