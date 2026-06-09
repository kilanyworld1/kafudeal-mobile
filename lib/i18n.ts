/**
 * KafuDeal i18n setup
 * ---------------------------------------------------------------------------
 * - On app launch:
 *     1. Read stored language from AsyncStorage (user's override, if any)
 *     2. Else detect device locale via expo-localization
 *     3. Apply RTL direction (Arabic = RTL, English = LTR) BEFORE first render
 *
 * - On user change (in Settings):
 *     1. Save preference to AsyncStorage (for next app launch)
 *     2. Sync `preferred_language` to the customers table in Supabase, so
 *        the server-side push-notification Edge Function can send updates
 *        in the user's chosen language.
 *     3. If RTL direction changed → call expo-updates.reloadAsync() to apply
 *        the layout flip immediately. If that fails, show a friendly
 *        "Restart required" alert in the user's language.
 *
 * Auth note: Supabase session is persisted in AsyncStorage, so the reload
 * preserves login state. AuthProvider re-reads the session on init.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { supabase } from './supabase';

import en from '../locales/en.json';
import ar from '../locales/ar.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'kafudeal:language';

const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];
export const isRTL = (lang: string): boolean =>
  RTL_LANGUAGES.includes(lang as SupportedLanguage);

/** Pick a supported language from the device's preferred locales. */
function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    for (const locale of locales) {
      const code = locale?.languageCode?.toLowerCase();
      if (code === 'ar') return 'ar';
      if (code === 'en') return 'en';
    }
  } catch {}
  return 'en';
}

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch {}
  return null;
}

export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || 'en';
}

/**
 * Persist the user's language choice to the customers table so server-side
 * code (push-notification Edge Function in particular) can send messages
 * in the right language.
 *
 * - Tries the `set_my_preferred_language` RPC first (preferred path).
 * - Falls back to a direct UPDATE on the customers row scoped by auth.uid().
 * - Silently returns on any error — language sync is best-effort and must
 *   never break the language-switch UX. Console-warn so we can debug.
 */
async function syncLanguageToDb(lang: SupportedLanguage): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      // Not signed in — nothing to sync. The next sign-in will re-evaluate.
      return;
    }

    // Try the RPC first (single round-trip, server-side validation).
    const rpcResult = await supabase.rpc('set_my_preferred_language', { lang });
    if (!rpcResult.error) return;

    // RPC missing or failed — fall back to a direct row update.
    // RLS must allow customers to update their own row (auth_user_id = auth.uid()).
    const { error: updateError } = await supabase
      .from('customers')
      .update({ preferred_language: lang })
      .eq('auth_user_id', session.user.id);

    if (updateError) {
      console.warn('[i18n] DB language sync failed:', updateError.message);
    }
  } catch (e) {
    console.warn('[i18n] DB language sync threw:', e);
  }
}

/**
 * Change the app language.
 * - Save to AsyncStorage + i18next.
 * - Sync to Supabase customers row (for push notifications).
 * - If RTL direction changed, reload the app via expo-updates so the layout
 *   flip takes effect everywhere. Falls back to a localized restart alert
 *   if reloadAsync isn't available (preview builds, dev mode, etc.).
 */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  // Best-effort DB sync. Don't block the UI.
  syncLanguageToDb(lang).catch(() => {});

  const shouldBeRTL = isRTL(lang);
  const directionChanged = I18nManager.isRTL !== shouldBeRTL;

  if (directionChanged) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);
    await new Promise((r) => setTimeout(r, 300));

    let reloadOk = false;
    try {
      await Updates.reloadAsync();
      reloadOk = true;
    } catch (err) {
      console.warn('[i18n] reloadAsync failed:', err);
    }

    if (!reloadOk) {
      const isAr = lang === 'ar';
      Alert.alert(
        isAr ? 'إعادة التشغيل مطلوبة' : 'Restart required',
        isAr
          ? 'أغلق التطبيق وأعد فتحه لإكمال تبديل اللغة.'
          : 'Please close and reopen the app to finish switching the language.',
        [{ text: isAr ? 'موافق' : 'OK' }]
      );
    }
  }
}

export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) return;

  const stored = await getStoredLanguage();
  const language: SupportedLanguage = stored || detectDeviceLanguage();

  I18nManager.allowRTL(true);
  if (isRTL(language) !== I18nManager.isRTL) {
    I18nManager.forceRTL(isRTL(language));
  }

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
    });

  // After init, attempt one background sync. Useful when:
  // - Device detected Arabic on first launch → DB still has 'en' default
  // - User had switched language on an old build that didn't sync
  syncLanguageToDb(language).catch(() => {});
}

export default i18n;
