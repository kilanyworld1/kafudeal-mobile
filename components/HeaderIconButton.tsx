import { useRef } from "react";
import { Pressable, Animated, View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "translucent" | "solid";
  size?: number;
  iconSize?: number;
  color?: string;
  /** Show a small badge dot if true, or render a count badge if a number > 0 is provided */
  showDot?: boolean | number;
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
    // Wrapper View carries the elevation/zIndex so taps always reach this button
    // even when it overlaps the gradient banner behind it.
    <View style={s.wrap}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        // Small symmetric hitSlop — the visible button is already 44px which is
        // a comfortable tap target. Bigger hitSlop was stealing taps from the
        // category chips below the banner on smaller phones.
        hitSlop={6}
        android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: true, radius: size }}
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
          {typeof showDot === "number" && showDot > 0 ? (
            <View
              style={[
                s.countBadge,
                {
                  borderColor: dotBorderColor,
                  top: -2,
                  right: -2,
                },
              ]}
            >
              <Text style={s.countText}>{showDot > 99 ? "99+" : showDot}</Text>
            </View>
          ) : showDot ? (
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
          ) : null}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  // Stack above the gradient banner AND the category strip below it so taps
  // always reach this button. Elevation matters on Android, zIndex on iOS.
  wrap: {
    zIndex: 50,
    elevation: 50,
  },
  dot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
  },
  countBadge: {
    position: "absolute",
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
});
