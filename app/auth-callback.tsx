import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../lib/supabase";

// This route catches the deep link returned from Supabase OAuth (kafudeal://auth-callback).
// We extract the code or token, exchange it for a session, then forward to the tabs.
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();

  useEffect(() => {
    (async () => {
      try {
        if (params.code) {
          await supabase.auth.exchangeCodeForSession(String(params.code));
        } else if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: String(params.access_token),
            refresh_token: String(params.refresh_token),
          });
        }
      } catch (e) {
        console.warn("Auth callback error", e);
      } finally {
        router.replace("/(tabs)");
      }
    })();
  }, [params.code, params.access_token, params.refresh_token]);

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
