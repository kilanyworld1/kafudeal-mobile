import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

// This route catches the deep link returned from Supabase OAuth (kafudeal://auth-callback).
// In practice, the auth-context.tsx handler that opens WebBrowser usually finishes the
// session-set first and this route just acts as a safety net.
export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      try {
        const url = (await Linking.getInitialURL()) || "";
        if (url) {
          // Tokens come in URL fragment for implicit flow
          const fragment = url.split("#")[1] || "";
          const fragParams = new URLSearchParams(fragment);
          const access_token = fragParams.get("access_token");
          const refresh_token = fragParams.get("refresh_token");
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          } else {
            // Fallback: code in query string for PKCE flow
            const qs = url.split("?")[1]?.split("#")[0] || "";
            const code = new URLSearchParams(qs).get("code");
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            }
          }
        }
      } catch (e) {
        console.warn("Auth callback error", e);
      } finally {
        router.replace("/(tabs)");
      }
    })();
  }, []);

  return (
    <View style={s.root}>
      <ActivityIndicator color="#FF6B2C" size="large" />
      <Text style={s.text}>Finishing sign-in…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF9F2" },
  text: { color: "#64748B", fontWeight: "700", marginTop: 14 },
});
