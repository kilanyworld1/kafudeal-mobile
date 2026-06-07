/**
 * KafuDeal i18n setup
 * ---------------------------------------------------------------------------
 * - On app launch:
 *     1. Read stored language from AsyncStorage (user's override, if any)
 *     2. Else detect device locale via expo-localization
 *     3. Apply RTL direction (Arabic = RTL, English = LTR) BEFORE first render
 *
 * - On user change (in Settings):
 *     1. Save preference to AsyncStorage
 *     2. If RTL direction changed → call expo-updates.reloadAsync() to apply
 *        the layout flip immediately.
 *
 * Auth note: Supabase session is persisted in AsyncStorage, so the reload
 * preserves login state. AuthProvider re-reads the session on init.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

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
 * Change the app language.
 * - If direction changes (LTR↔RTL), trigger a full app reload via
 *   Updates.reloadAsync() so the new layout takes effect everywhere.
 * - Supabase auth session is preserved across reload (stored in AsyncStorage,
 *   re-read by AuthProvider on init).
 */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  const shouldBeRTL = isRTL(lang);
  const directionChanged = I18nManager.isRTL !== shouldBeRTL;

  if (directionChanged) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);
    // Small delay so the AsyncStorage write completes before reload.
    await new Promise((r) => setTimeout(r, 300));
    try {
      await Updates.reloadAsync();
    } catch (err) {
      console.warn('[i18n] reloadAsync failed (dev mode?):', err);
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
}

export default i18n;
