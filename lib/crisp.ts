/**
 * Crisp Chat wrapper.
 *
 * The SDK ('react-native-crisp-chat-sdk') is a native module — it only works
 * inside an EAS build, never in Expo Go. To keep the JS bundle from crashing
 * if the native side is missing for any reason, every call is wrapped in a
 * try/catch with a console warning.
 *
 * Website ID is hard-coded — matches the same ID used in the web app's
 * index.html. If you ever rotate it, update both.
 */

import type { Customer } from "./types";

const CRISP_WEBSITE_ID = "35a4fb2b-229a-4f51-b68c-17a367714873";

// Lazy require so a missing native module never blocks the JS bundle from
// loading. If the require fails we just no-op everything.
let sdk: any = null;
function loadSdk() {
  if (sdk !== null) return sdk;
  try {
    sdk = require("react-native-crisp-chat-sdk");
  } catch (e) {
    console.warn("[crisp] SDK not available — chat features disabled", e);
    sdk = false;
  }
  return sdk;
}

let configured = false;

export function initCrisp() {
  if (configured) return;
  const s = loadSdk();
  if (!s) return;
  try {
    s.configure(CRISP_WEBSITE_ID);
    configured = true;
  } catch (e) {
    console.warn("[crisp] configure failed", e);
  }
}

/**
 * Attach the signed-in customer to their Crisp session so support agents see
 * who they're talking to and message history persists across devices.
 */
export function identifyCrispUser(customer: Customer | null) {
  const s = loadSdk();
  if (!s || !customer) return;
  try {
    if (customer.id && s.setUserTokenId) s.setUserTokenId(String(customer.id));
    if (customer.email && s.setUserEmail) s.setUserEmail(customer.email);
    if (customer.fullName && s.setUserNickname) s.setUserNickname(customer.fullName);
    if (customer.phone && s.setUserPhone) s.setUserPhone(customer.phone);
  } catch (e) {
    console.warn("[crisp] identify failed", e);
  }
}

/** Call on sign-out so the next user doesn't inherit the previous session. */
export function resetCrispSession() {
  const s = loadSdk();
  if (!s) return;
  try {
    s.resetSession?.();
  } catch (e) {
    console.warn("[crisp] reset failed", e);
  }
}

/** Open the native Crisp chat overlay. Wire to any "Chat with us" button. */
export function openCrispChat() {
  const s = loadSdk();
  if (!s) return;
  try {
    // The package's default export is a function that opens the chat.
    const open = s.default || s.show;
    if (typeof open === "function") {
      open();
    } else {
      console.warn("[crisp] no callable default export found on SDK");
    }
  } catch (e) {
    console.warn("[crisp] open failed", e);
  }
}
