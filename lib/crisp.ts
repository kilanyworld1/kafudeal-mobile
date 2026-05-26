/**
 * Crisp Chat — in-app browser approach.
 *
 * We avoided the native SDK (`react-native-crisp-chat-sdk`) because its latest
 * versions ship Kotlin 2.1.0 metadata, which Expo SDK 52's Gradle plugin can't
 * read (it's locked to Kotlin 1.9.x). The in-app browser is reliable, ships
 * immediately on any Expo SDK, and the Crisp hosted chat page is responsive
 * and looks native.
 *
 * When we upgrade to Expo SDK 53+ later, we can switch to Crisp's official
 * `crisp-sdk-react-native` for a true native overlay.
 */

import * as WebBrowser from "expo-web-browser";
import type { Customer } from "./types";

const CRISP_WEBSITE_ID = "35a4fb2b-229a-4f51-b68c-17a367714873";

// Keep an in-memory copy of the latest identified customer so openCrispChat()
// can pass it as URL params when opening the hosted page.
let currentCustomer: Customer | null = null;

/** No-op on this implementation — kept for API parity. */
export function initCrisp() {
  // Hosted chat needs no boot step.
}

/** Remember the signed-in customer so we can pre-fill name/email when opening chat. */
export function identifyCrispUser(customer: Customer | null) {
  currentCustomer = customer;
}

/** Clear the cached identity on sign-out so the next user starts fresh. */
export function resetCrispSession() {
  currentCustomer = null;
}

/**
 * Open Crisp's hosted chatbox in the in-app browser. The user can chat with
 * support without leaving the app — closing the browser returns them to the
 * exact screen they were on.
 */
export async function openCrispChat() {
  try {
    const params = new URLSearchParams({ website_id: CRISP_WEBSITE_ID });

    // Pre-fill identity if we know the user
    if (currentCustomer?.email) params.set("user_email", currentCustomer.email);
    if (currentCustomer?.fullName) params.set("user_nickname", currentCustomer.fullName);
    if (currentCustomer?.phone) params.set("user_phone", currentCustomer.phone);
    // Per Crisp support — the documented param is `token_id`, not `user_token`.
    if (currentCustomer?.id) params.set("token_id", String(currentCustomer.id));

    const url = `https://go.crisp.chat/chat/embed/?${params.toString()}`;

    await WebBrowser.openBrowserAsync(url, {
      // Match KafuDeal's orange so the in-app browser chrome doesn't look out of place
      toolbarColor: "#FF6B2C",
      controlsColor: "#FFFFFF",
      dismissButtonStyle: "close",
      enableBarCollapsing: false,
    });
  } catch (e) {
    console.warn("[crisp] open failed", e);
  }
}
