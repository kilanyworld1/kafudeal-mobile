import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { authAPI } from "./api";
import { transformCustomer } from "./transformers";
import type { Customer } from "./types";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Trust the server-side trigger (handle_new_user) to create the customers row.
  // We just READ the profile. If the trigger hasn't run yet for a brand-new
  // signup, retry a couple of times.
  useEffect(() => {
    if (!session?.user) {
      setCustomer(null);
      return;
    }
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data } = await authAPI.getProfile();
        if (cancelled) return;
        if (data) {
          setCustomer(transformCustomer(data));
          return;
        }
        // wait a bit for the trigger to fire on first signup
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    })();
    return () => {
      cancelled = true;
    };
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
        // Implicit flow: tokens come in the URL fragment (#access_token=…&refresh_token=…)
        const fragment = result.url.split("#")[1] || "";
        const fragParams = new URLSearchParams(fragment);
        const access_token = fragParams.get("access_token");
        const refresh_token = fragParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
          return;
        }

        // Fallback: code query param (PKCE)
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
          return;
        }

        const oauthError =
          fragParams.get("error_description") || url.searchParams.get("error_description");
        if (oauthError) throw new Error(oauthError);
      }
    } catch (e: any) {
      console.warn("Auth error:", e?.message || e);
      Alert.alert("Sign-in failed", e?.message || "Please try again.");
    }
  }, []);

  const signInWithGoogle = useCallback(() => signInWithProvider("google"), [signInWithProvider]);
  const signInWithApple = useCallback(() => signInWithProvider("apple"), [signInWithProvider]);
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
