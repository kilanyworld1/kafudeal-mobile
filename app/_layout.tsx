import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";
import { NotificationsProvider } from "../lib/notifications-context";
import { initCrisp } from "../lib/crisp";

// Keep the OS splash screen up until we explicitly hide it once fonts
// finish loading. This removes the brief white flash users saw between
// the splash disappearing and the home screen rendering.
SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore — module not available in some web/test contexts
});

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

  // Notification tap → deep link. The push payload should include a
  // `route` field (e.g. "/order/abc-123" or "/product/xyz"). The Edge
  // Function that sends pushes is responsible for setting it.
  useEffect(() => {
    // 1. App was killed and opened by tapping a notification
    (async () => {
      const initial = await Notifications.getLastNotificationResponseAsync();
      const route = initial?.notification?.request?.content?.data?.route;
      if (typeof route === "string" && route.startsWith("/")) {
        // Defer so the navigator is mounted before we navigate.
        setTimeout(() => router.push(route as any), 200);
      }
    })();

    // 2. App was foreground/background and the user tapped a push
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const route = res?.notification?.request?.content?.data?.route;
      if (typeof route === "string" && route.startsWith("/")) {
        router.push(route as any);
      }
    });
    return () => sub.remove();
  }, []);

  // Hide the splash only once we're actually ready to render UI. This
  // bridges the gap that previously showed a white flash.
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are loaded (or have errored out).
  // The splash screen stays visible during this window.
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
