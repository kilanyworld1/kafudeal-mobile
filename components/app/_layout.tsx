import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
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
        </Stack>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
