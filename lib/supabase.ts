import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // We handle the redirect ourselves via WebBrowser, so do not parse from URL
    detectSessionInUrl: false,
    // Use implicit flow on mobile. PKCE loses the code_verifier when the
    // app process gets backgrounded during the OAuth WebBrowser session,
    // causing "PKCE code verifier not found in storage".
    flowType: "implicit",
  },
});
