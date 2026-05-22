import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { authAPI } from "./api";
import type { Customer } from "./types";
import { APP_SCHEME } from "./config";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  customer: Customer | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // When user logs in, ensure a customer row exists
  useEffect(() => {
    if (!session?.user) {
      setCustomer(null);
      return;
    }
    (async () => {
      const c = await authAPI.getOrCreateCustomer(
        session.user.id,
        session.user.email ?? undefined,
        (session.user.user_metadata?.full_name as string) ?? undefined
      );
      setCustomer(c);
    })();
  }, [session?.user?.id]);

  const signInWithProvider = useCallback(async (provider: "google" | "apple" | "facebook") => {
    try {
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data?.url) throw error || new Error("No OAuth URL");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else {
          // Implicit-flow fallback: tokens may be in URL fragment
          const fragment = result.url.split("#")[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("Auth error:", e?.message || e);
      Alert.alert("Sign-in failed", e?.message || "Please try again.");
    }
  }, []);

  const signInWithGoogle   = useCallback(() => signInWithProvider("google"),   [signInWithProvider]);
  const signInWithApple    = useCallback(() => signInWithProvider("apple"),    [signInWithProvider]);
  const signInWithFacebook = useCallback(() => signInWithProvider("facebook"), [signInWithProvider]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        customer,
        loading,
        signInWithGoogle,
        signInWithApple,
        signInWithFacebook,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
