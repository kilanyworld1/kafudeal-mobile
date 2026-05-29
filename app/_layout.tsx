import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";
import { NotificationsProvider } from "../lib/notifications-context";
import { initCrisp } from "../lib/crisp";

// Ionicons font — we keep our own copy in assets/fonts/ so Metro bundles it
// reliably (require()ing from node_modules occasionally got dropped).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const IONICONS_FONT = require("../assets/fonts/Ionicons.ttf");

export default function RootLayout() {
  // Wait for the Ionicons font to load before rendering anything. If we
  // render before fonts load, the Ionicons components show blank glyphs.
  // Needs expo-file-system as a native dep, otherwise loading fails silently.
  const [fontsLoaded, fontError] = useFonts({
    Ionicons: IONICONS_FONT,
  });

  // Initialise Crisp once when the app boots.
  useEffect(() => {
    initCrisp();
  }, []);

  // Don't render until fonts are loaded (or have errored out).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <NotificationsProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
              <Stack.Screen name="index" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              <Stack.Screen name="login" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="search" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="store/[id]" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="addresses" />
              <Stack.Screen name="add-address" />
              <Stack.Screen name="saved" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="vouchers" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="help" />
              <Stack.Screen name="auth-callback" options={{ animation: "fade" }} />
            </Stack>
          </NotificationsProvider>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
