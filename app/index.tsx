import { useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import KafuMark from "../components/KafuMark";

export default function Splash() {
  const logoScale = useSharedValue(0.55);
  const logoOpacity = useSharedValue(0);
  const float = useSharedValue(0);
  const haloRotate = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withTiming(1, {
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    // gentle float
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    // halo spin
    haloRotate.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );

    const t = setTimeout(() => router.replace("/(tabs)"), 2400);
    return () => clearTimeout(t);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: float.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${haloRotate.value}deg` }],
  }));

  return (
    <LinearGradient
      colors={["#FF6B2C", "#FF8C3A", "#FFA45E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Spinning halo behind the logo */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
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
          },
          haloStyle,
        ]}
      />

      {/* Skip */}
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
        <Text className="text-white font-bold text-xs">Skip →</Text>
      </Pressable>

      <View className="flex-1 items-center justify-center px-8">
        <Animated.View style={logoStyle}>
          <View
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 18 },
              shadowRadius: 40,
            }}
          >
            <KafuMark size={160} variant="white" />
          </View>
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

        {/* Trust strip */}
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
