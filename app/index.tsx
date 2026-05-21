import { useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import KafuMark from "../components/KafuMark";

export default function Splash() {
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const haloRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(logoScale, {
      toValue: 1,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(haloRotate, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const t = setTimeout(() => router.replace("/(tabs)"), 2400);
    return () => clearTimeout(t);
  }, []);

  const rotate = haloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={["#FF6B2C", "#FF8C3A", "#FFA45E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{ flex: 1 }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          borderRadius: 150,
          borderWidth: 24,
          borderColor: "rgba(255,255,255,0.15)",
          opacity: 0.6,
          transform: [{ rotate }],
        }}
      />

      <Pressable
        onPress={() => router.replace("/(tabs)")}
        style={{
          position: "absolute",
          top: 60,
          right: 24,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.2)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>Skip →</Text>
      </Pressable>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: float }],
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 18 },
            shadowRadius: 40,
          }}
        >
          <KafuMark size={160} variant="white" />
        </Animated.View>

        <Text
          style={{
            fontSize: 56,
            fontWeight: "800",
            color: "white",
            letterSpacing: -1.8,
            marginTop: 28,
          }}
        >
          Kafu<Text style={{ color: "#0B1020" }}>Deal</Text>
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.95)",
            marginTop: 12,
            textAlign: "center",
            fontWeight: "500",
            maxWidth: 320,
          }}
        >
          Save up to 70% on groceries about to expire
        </Text>

        <ActivityIndicator color="white" style={{ marginTop: 40 }} />

        <View
          style={{
            position: "absolute",
            bottom: 110,
            left: 32,
            right: 32,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {[
            { num: "−70%", lbl: "OFF" },
            { num: "2h", lbl: "DELIVERY" },
            { num: "100%", lbl: "VERIFIED" },
          ].map((t, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>{t.num}</Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 9.5,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  marginTop: 2,
                }}
              >
                {t.lbl}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "rgba(255,255,255,0.85)",
            fontSize: 10.5,
            fontWeight: "700",
            letterSpacing: 2,
          }}
        >
          FRESH STOCK · UAE STORES · DAILY DROPS
        </Text>
      </View>
    </LinearGradient>
  );
}
