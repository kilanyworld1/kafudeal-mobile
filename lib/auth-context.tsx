import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { authAPI } from "./api";
import { transformCustomer } from "./transformers";
import type { Customer } from "./types";
import { identifyCrispUser, resetCrispSession } from "./crisp";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  customer: Customer | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  // Force a re-fetch of the customer profile. Useful when a screen
  // discovers the customer is null but the user is clearly signed in —
  // e.g. checkout pressing "place order" and finding no customer.id yet.
  refreshProfile: () => Promise<Customer | null>;
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

  // refreshProfile — try to read the customer row, and if the server-side
  // trigger (handle_new_user) never created one, create it ourselves from
  // the auth session metadata. This is the self-healing path: even if the
  // trigger is missing or broken, the app recovers.
  //
  // RLS allows this insert because customers_own_profile_only permits
  // inserts where auth_user_id = auth.uid().
  const refreshProfile = useCallback(async (): Promise<Customer | null> => {
    const u = session?.user;
    if (!u) {
      setCustomer(null);
      return null;
    }

    // 1. Try a few times to read an existing row (covers the trigger-just-fired race)
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data } = await authAPI.getProfile();
      if (data) {
        const c = transformCustomer(data);
        setCustomer(c);
        identifyCrispUser(c);
        return c;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }

    // 2. Still nothing — the trigger didn't fire for this user. Create the
    // row from the client. RLS lets us insert as long as auth_user_id is
    // our own auth.uid().
    try {
      const fallbackName =
        (u.user_metadata?.full_name as string) ||
        (u.user_metadata?.name as string) ||
        (u.user_metadata?.preferred_username as string) ||
        (u.email ? u.email.split("@")[0] : "Customer");

      const { data: created, error } = await supabase
        .from("customers")
        .insert({
          auth_user_id: u.id,
          email: u.email,
          name: fallbackName,
        })
        .select()
        .single();

      if (error || !created) {
        console.warn("Self-heal customer insert failed:", error);
        return null;
      }
      const c = transformCustomer(created);
      setCustomer(c);
      identifyCrispUser(c);
      return c;
    } catch (e) {
      console.warn("Self-heal customer insert threw:", e);
      return null;
    }
  }, [session?.user?.id]);

  // On every auth-state change, run a fresh profile fetch / create.
  useEffect(() => {
    if (!session?.user) {
      setCustomer(null);
      // No active session — wipe the Crisp identity so the next user starts fresh.
      resetCrispSession();
      return;
    }
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await refreshProfile();
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, refreshProfile]);

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
  const signInWithFacebook = useCallback(() => signInWithProvider("facebook"), [signInWithProvider]);

  /**
   * Apple sign-in uses the NATIVE iOS Sign-In flow (Face ID overlay), not the
   * web OAuth flow. This matches Apple's UX guidelines, avoids the 6-month
   * JWT rotation, and is what App Store reviewers expect to see.
   * iOS-only — on Android we'd fall back to OAuth, but currently there's no
   * Apple sign-in button shown on Android since most Android users wouldn't
   * have an Apple ID anyway.
   */
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Sign in with Apple", "Available on iOS devices only.");
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("No identity token returned from Apple");
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (e: any) {
      // User cancelled — silent, that's expected
      if (e?.code === "ERR_REQUEST_CANCELED") return;
      console.warn("Apple sign-in error:", e?.message || e);
      Alert.alert("Sign-in failed", e?.message || "Please try again.");
    }
  }, []);

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
        refreshProfile,
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
