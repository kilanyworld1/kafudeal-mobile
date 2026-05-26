import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";
import { NotificationsProvider } from "../lib/notifications-context";
import { initCrisp } from "../lib/crisp";

export default function RootLayout() {
  // Explicitly load Ionicons font. In Expo SDK 52 with the new architecture,
  // @expo/vector-icons' built-in font auto-registration can fail to fire when
  // the native dependency tree shifts (which happened when we added
  // expo-apple-authentication + expo-asset). Loading the font here guarantees
  // it's available before any <Ionicons /> renders.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // Initialise Crisp once when the app boots. Identity gets attached later in
  // AuthProvider when we know who the customer is.
  useEffect(() => {
    initCrisp();
  }, []);

  if (!fontsLoaded) {
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
