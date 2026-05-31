/**
 * Friendly "Want order updates?" pre-prompt.
 *
 * Android (API 33+) shows its own POST_NOTIFICATIONS system dialog — but
 * that dialog can't be re-shown if the user denies it. So we show OUR
 * dialog first with a clear value prop, and only call requestPermission()
 * when they tap "Yes". This is the recommended Android UX pattern.
 *
 * iOS shows its own system permission dialog too, but only ONCE — same
 * deal: prep the user with our copy first.
 *
 * Triggers:
 *   - After sign-in, home screen mounts, customer is set
 *   - Permission status is "undetermined" (never asked)
 *   - We've shown the user a few products (5s delay so we don't ambush them)
 *
 * If user declines, checkout.tsx will re-prompt after the first successful
 * order — that's the second-chance moment.
 */

import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getPermissionStatus,
  hasBeenAsked,
  requestPermission,
  registerDeviceForCustomer,
} from "../lib/push";
import { useAuth } from "../lib/auth-context";

type Props = {
  /** Delay before showing the prompt, in ms. Defaults to 5000 (5s). */
  delayMs?: number;
};

export default function NotificationPrePrompt({ delayMs = 5000 }: Props) {
  const { customer } = useAuth();
  const [visible, setVisible] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    let cancelled = false;
    let timer: any;
    (async () => {
      if (!customer?.id) return;
      const asked = await hasBeenAsked();
      if (cancelled || asked) return;
      const status = await getPermissionStatus();
      if (cancelled || status !== "undetermined") return;
      timer = setTimeout(() => {
        if (cancelled) return;
        setVisible(true);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      }, delayMs);
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [customer?.id, delayMs]);

  const close = () => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 40, duration: 180, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const accept = async () => {
    const status = await requestPermission();
    if (status === "granted" && customer?.id) {
      await registerDeviceForCustomer(customer.id);
    }
    close();
  };

  const decline = async () => {
    // Still mark "asked" so we don't re-prompt on every home mount.
    // Checkout will offer a second chance after order success.
    await requestPermission().catch(() => {});
    close();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Animated.View style={[s.backdrop, { opacity: fade }]}>
        <Pressable style={s.backdropPress} onPress={close} />
        <Animated.View style={[s.card, { transform: [{ translateY: slide }] }]}>
          <View style={s.iconWrap}>
            <Ionicons name="notifications" size={28} color="#FF6B2C" />
          </View>
          <Text style={s.title}>Stay on top of your orders</Text>
          <Text style={s.body}>
            Get notified when your order is confirmed, on its way, and delivered.
            You can change this anytime in Settings.
          </Text>
          <Pressable onPress={accept} style={s.acceptBtn}>
            <Text style={s.acceptText}>Yes, notify me</Text>
          </Pressable>
          <Pressable onPress={decline} style={s.declineBtn}>
            <Text style={s.declineText}>Maybe later</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  backdropPress: { ...StyleSheet.absoluteFillObject },
  card: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  body: {
    fontSize: 13.5, color: "#64748B", textAlign: "center",
    marginTop: 8, lineHeight: 20, paddingHorizontal: 6,
  },
  acceptBtn: {
    marginTop: 20,
    backgroundColor: "#FF6B2C",
    borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
    alignSelf: "stretch", alignItems: "center",
  },
  acceptText: { color: "white", fontSize: 15, fontWeight: "800" },
  declineBtn: { marginTop: 10, paddingVertical: 10 },
  declineText: { color: "#64748B", fontSize: 13.5, fontWeight: "700" },
});
