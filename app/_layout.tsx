import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";
import { NotificationsProvider } from "../lib/notifications-context";
import { initCrisp } from "../lib/crisp";

// IMPORTANT: hoist the font require to module top-level so Metro detects it
// statically and includes the .ttf in the bundle. Putting require() inside a
// function call (like useFonts({...})) sometimes hides it from Metro's static
// analyzer, which is why the font wasn't getting bundled in earlier builds.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const IONICONS_FONT = require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf");

export default function RootLayout() {
  // Load Ionicons font. The require is hoisted above so Metro definitely
  // bundles the asset. Non-blocking: app renders even if fonts haven't loaded yet.
  useFonts({ Ionicons: IONICONS_FONT });

  // Initialise Crisp once when the app boots. Identity gets attached later in
  // AuthProvider when we know who the customer is.
  useEffect(() => {
    initCrisp();
  }, []);

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
