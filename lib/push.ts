/**
 * Push notifications — registration + permission flow.
 *
 * The flow:
 *   1. After sign-in, registerForPushNotifications() asks the OS for
 *      permission (or returns the existing status).
 *   2. If granted, we fetch the Expo Push Token for this device and
 *      upsert it into customer_devices keyed by the token itself.
 *   3. If the user toggles notifications off in Settings, we DON'T
 *      delete the device row — we just respect the customers.notifications_enabled
 *      flag server-side when sending.
 *
 * Why upsert by token (not by customer)? A user can be signed in on
 * multiple devices — each device gets its own row. Deleting by customer
 * would wipe all of them. Tokens are globally unique per Expo project.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const ASK_AGAIN_FLAG = "kafudeal.push.permission.asked";

// How the OS should handle notifications when the app is in the foreground.
// We let banners/alerts show (so user sees them right away) and play the sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

/**
 * Read the current notification permission status without prompting.
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (!Device.isDevice) return "undetermined";
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

/**
 * Ask the OS for permission. Returns the resulting status.
 * Safe to call multiple times — if already granted/denied, returns
 * the existing status without re-prompting.
 */
export async function requestPermission(): Promise<PermissionStatus> {
  if (!Device.isDevice) return "undetermined";

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return "granted";
  if (existing.status === "denied" && !existing.canAskAgain) return "denied";

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  await AsyncStorage.setItem(ASK_AGAIN_FLAG, "1");
  return status as PermissionStatus;
}

/**
 * Have we ever asked the user about notifications? If not, the home
 * screen can show our friendly pre-prompt. If yes-denied, we should
 * wait for a contextual moment (like post-order) to ask again.
 */
export async function hasBeenAsked(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ASK_AGAIN_FLAG);
  return v === "1";
}

/**
 * Get this device's Expo Push Token. Requires permission to be granted.
 * Returns null if permission isn't granted, we're on a simulator, or
 * the project id couldn't be resolved.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") return null;

  // EAS projectId is required so Expo can route the push to our project.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants as any).easConfig?.projectId;
  if (!projectId) {
    console.warn("No EAS projectId in app config — can't get push token");
    return null;
  }

  try {
    const res = await Notifications.getExpoPushTokenAsync({ projectId });
    return res.data; // "ExponentPushToken[xxxxxxxx]"
  } catch (e) {
    console.warn("getExpoPushTokenAsync failed:", e);
    return null;
  }
}

/**
 * Upsert the device row in customer_devices so the server knows where
 * to send pushes for this customer. Call this whenever:
 *   - The user signs in
 *   - The token rotates (rare — Expo rotates them occasionally)
 *
 * Returns true on success, false if anything went wrong.
 */
export async function registerDeviceForCustomer(customerId: string): Promise<boolean> {
  const token = await getExpoPushToken();
  if (!token) return false;

  const platform = Platform.OS as "ios" | "android";

  // Upsert by token (unique). If this token already exists tied to a
  // different customer (e.g. account switch on the same device), we
  // re-point it to the current customer.
  const { error } = await supabase
    .from("customer_devices")
    .upsert(
      {
        customer_id: customerId,
        expo_push_token: token,
        platform,
        device_name: Device.deviceName || Device.modelName || null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "expo_push_token" }
    );

  if (error) {
    console.warn("Push token upsert failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Remove this device's token from the customer's set. Call this on
 * sign-out so the previous account doesn't keep getting pushes after
 * a different user signs in on this phone.
 */
export async function unregisterDevice(): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;
  await supabase.from("customer_devices").delete().eq("expo_push_token", token);
}
