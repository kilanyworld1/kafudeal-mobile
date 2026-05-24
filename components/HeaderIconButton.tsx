import { useRef } from "react";
import { Pressable, Animated, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "translucent" | "solid";
  size?: number;
  iconSize?: number;
  color?: string;
  showDot?: boolean;
};

/**
 * Round icon button used in the home top bar / sticky header.
 * - Big tappable area (hitSlop 14 + 40px container)
 * - Springy press animation (scale down + back)
 * - Optional dot indicator (for unread notifications)
 */
export default function HeaderIconButton({
  icon,
  onPress,
  variant = "translucent",
  size = 40,
  iconSize = 20,
  color = "white",
  showDot,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.85, friction: 5, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  };

  const bg =
    variant === "translucent"
      ? "rgba(255,255,255,0.20)"
      : "#F1EFE8";
  const borderColor =
    variant === "translucent" ? "rgba(255,255,255,0.30)" : "transparent";
  const dotBorderColor = variant === "translucent" ? "#FF8C3A" : "white";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={14}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            borderWidth: variant === "translucent" ? 1 : 0,
            borderColor,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale }],
          },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={color} />
        {showDot && (
          <View
            style={[
              s.dot,
              {
                backgroundColor: variant === "translucent" ? "#FFC857" : "#FF6B2C",
                borderColor: dotBorderColor,
                top: size * 0.18,
                right: size * 0.18,
              },
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  dot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
  },
});
