/**
 * Friendly "Want order updates?" pre-prompt.
 *
 * Two flavours:
 *  - status === 'undetermined' → standard pre-prompt, the "Yes" button
 *    triggers the OS permission dialog.
 *  - status === 'denied' + canAskAgain → same pre-prompt, the "Yes"
 *    button can still trigger the OS dialog (it'll re-prompt).
 *  - status === 'denied' + canAskAgain === false → the OS won't let us
 *    re-prompt. We change the CTA copy and tap-action to "Open Settings"
 *    so the user can flip the toggle manually. This is the path for
 *    Huawei/OnePlus/Xiaomi/Oppo etc. that default to "deny" at install.
 *
 * Hides if status === 'granted' — nothing to do.
 *
 * Triggers:
 *   - Customer is set
 *   - 5s delay so we don't ambush them
 *   - Not already asked in this app install (AsyncStorage flag)
 */

import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import {
  hasBeenAsked,
  requestPermission,
  registerDeviceForCustomer,
} from "../lib/push";
import { useAuth } from "../lib/auth-context";

type Props = {
  /** Delay before showing the prompt, in ms. Defaults to 5000 (5s). */
  delayMs?: number;
};

type Mode = "ask" | "openSettings";

export default function NotificationPrePrompt({ delayMs = 5000 }: Props) {
  const { customer } = useAuth();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("ask");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    let cancelled = false;
    let timer: any;
    (async () => {
      if (!customer?.id) return;
      const asked = await hasBeenAsked();
      if (cancelled || asked) return;

      const perms = await Notifications.getPermissionsAsync();
      if (cancelled) return;

      // Already granted — nothing to do; auth-context will register token.
      if (perms.status === "granted") return;

      // Denied with no way to re-ask → switch to "Open Settings" mode
      // so the user can flip the toggle from the OS app info page.
      // Common on OnePlus / Huawei / Xiaomi / Oppo where the OS defaults
      // to deny at install time.
      const canReAsk = perms.canAskAgain !== false;
      const isDeniedHard = perms.status === "denied" && !canReAsk;

      setMode(isDeniedHard ? "openSettings" : "ask");

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
    if (mode === "openSettings") {
      // OS won't let us re-prompt — best we can do is bounce to Settings.
      try {
        await Linking.openSettings();
      } catch {
        // ignore
      }
      close();
      return;
    }

    const status = await requestPermission();
    if (status === "granted" && customer?.id) {
      await registerDeviceForCustomer(customer.id);
    }
    close();
  };

  const decline = async () => {
    // Mark "asked" so we don't pester them every home mount. Checkout
    // still has a second-chance prompt after their first successful order.
    await requestPermission().catch(() => {});
    close();
  };

  if (!visible) return null;

  const acceptLabel = mode === "openSettings" ? "Open Settings" : "Yes, notify me";
  const bodyText =
    mode === "openSettings"
      ? `Notifications are turned off for KafuDeal in your ${Platform.OS === "ios" ? "iPhone" : "phone"} settings. Open Settings to allow them so we can keep you updated about your orders.`
      : "Get notified when your order is confirmed, on its way, and delivered. You can change this anytime in Settings.";

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Animated.View style={[s.backdrop, { opacity: fade }]}>
        <Pressable style={s.backdropPress} onPress={close} />
        <Animated.View style={[s.card, { transform: [{ translateY: slide }] }]}>
          <View style={s.iconWrap}>
            <Ionicons name="notifications" size={28} color="#FF6B2C" />
          </View>
          <Text style={s.title}>Stay on top of your orders</Text>
          <Text style={s.body}>{bodyText}</Text>
          <Pressable onPress={accept} style={s.acceptBtn}>
            <Text style={s.acceptText}>{acceptLabel}</Text>
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
