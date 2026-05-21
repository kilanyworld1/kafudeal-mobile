import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import KafuMark from "../components/KafuMark";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#FF6B2C", "#FF8C3A"]} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={22} color="white" />
        </Pressable>
        <View style={s.logo}>
          <KafuMark size={72} variant="white" />
        </View>
        <Text style={s.welcome}>Welcome to KafuDeal</Text>
        <Text style={s.sub}>Sign in to start saving on groceries</Text>
      </LinearGradient>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }}>
        <Pressable style={[s.social, { backgroundColor: "#0F172A" }]}>
          <Ionicons name="logo-apple" size={20} color="white" />
          <Text style={[s.socialText, { color: "white" }]}>Continue with Apple</Text>
        </Pressable>
        <Pressable style={[s.social, s.socialOutline]}>
          <Ionicons name="logo-google" size={20} color="#0F172A" />
          <Text style={s.socialText}>Continue with Google</Text>
        </Pressable>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or sign in with email</Text>
          <View style={s.dividerLine} />
        </View>

        <Text style={s.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          style={s.input}
        />

        <Text style={s.label}>Password</Text>
        <View style={s.pwWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPw}
            style={[s.input, { paddingRight: 44, marginBottom: 0 }]}
          />
          <Pressable onPress={() => setShowPw(!showPw)} style={s.eye}>
            <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
          </Pressable>
        </View>

        <Pressable style={{ marginTop: 8 }}>
          <Text style={s.forgot}>Forgot password?</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={s.primaryBtn}
        >
          <Text style={s.primaryBtnText}>Sign in</Text>
        </Pressable>

        <View style={s.signupRow}>
          <Text style={{ color: "#64748B", fontSize: 13 }}>Don't have an account? </Text>
          <Pressable>
            <Text style={s.signupLink}>Sign up</Text>
          </Pressable>
        </View>

        <Text style={s.terms}>
          By continuing you agree to our{" "}
          <Text style={s.termsLink}>Terms</Text> and <Text style={s.termsLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 80, paddingBottom: 36, paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  closeBtn: {
    position: "absolute", top: 56, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  logo: { marginBottom: 16 },
  welcome: { fontSize: 22, fontWeight: "800", color: "white", letterSpacing: -0.5 },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  body: { flex: 1, backgroundColor: "#FFF9F2", padding: 20 },
  social: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 14, borderRadius: 14, marginBottom: 10,
  },
  socialOutline: {
    backgroundColor: "white",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
  },
  socialText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(15,23,42,0.10)" },
  dividerText: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  label: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: "white",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#0F172A",
    marginBottom: 14,
  },
  pwWrap: { position: "relative", marginBottom: 14 },
  eye: { position: "absolute", right: 14, top: 13, padding: 4 },
  forgot: { color: "#FF6B2C", fontSize: 13, fontWeight: "700" },
  primaryBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: { color: "white", fontSize: 15, fontWeight: "800" },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  signupLink: { color: "#FF6B2C", fontSize: 13, fontWeight: "800" },
  terms: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 24, lineHeight: 18 },
  termsLink: { color: "#FF6B2C", fontWeight: "700" },
});
