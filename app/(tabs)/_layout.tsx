import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Animated, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useCart } from "../../lib/cart-context";
import { useAuth } from "../../lib/auth-context";

function CartTabIcon({ color }: { color: string }) {
  const { count, badgeScale } = useCart();
  return (
    <View>
      <Ionicons name="cart" size={22} color={color} />
      {count > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            backgroundColor: "#FF6B2C",
            borderRadius: 999,
            paddingHorizontal: 5,
            minWidth: 16,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: badgeScale }],
          }}
        >
          <Text style={{ color: "white", fontSize: 9, fontWeight: "800" }}>{count}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function AccountTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { user } = useAuth();
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    "";

  if (avatarUrl) {
    return (
      <View
        style={{
          width: 26, height: 26, borderRadius: 13,
          borderWidth: 2, borderColor: focused ? "#FF6B2C" : "transparent",
          overflow: "hidden",
        }}
      >
        <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} />
      </View>
    );
  }
  return <Ionicons name="person-circle-outline" size={24} color={color} />;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF6B2C",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(15,23,42,0.08)",
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.home"),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: t("tab.deals"),
          tabBarIcon: ({ color }) => <Ionicons name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tab.cart"),
          tabBarIcon: ({ color }) => <CartTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("tab.orders"),
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("tab.account"),
          tabBarIcon: ({ color, focused }) => <AccountTabIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
