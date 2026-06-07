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
 *     2. Sync to customers.preferred_language in Supabase (best-effort)
 *     3. If RTL direction changed → call expo-updates.reloadAsync() to apply
 *        the layout flip immediately. (RN's I18nManager.forceRTL only takes
 *        effect on next JS bundle start.)
 *
 * Usage in a component:
 *     import { useTranslation } from 'react-i18next';
 *     const { t } = useTranslation();
 *     <Text>{t('common.save')}</Text>
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
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
  } catch {
    // expo-localization can throw in some sandboxed environments — fall through
  }
  return 'en';
}

/** Read the user's stored override, if any. Returns null if none set. */
export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch {}
  return null;
}

/** Currently active language. */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || 'en';
}

/**
 * Change the app language. If the RTL/LTR direction changes, we reload the JS
 * bundle so the new layout direction takes effect everywhere.
 *
 * Caller should show a brief "applying…" indicator and ideally a confirmation
 * dialog before calling this if a reload will happen.
 */
export async function setLanguage(lang: SupportedLanguage): Promise<{
  willReload: boolean;
}> {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  const shouldBeRTL = isRTL(lang);
  const directionChanged = I18nManager.isRTL !== shouldBeRTL;

  if (directionChanged) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);

    // Reload the JS bundle so the new direction takes effect.
    // In Expo Go / dev, reloadAsync may not be available — fall back gracefully.
    try {
      if (Updates.reloadAsync) {
        await Updates.reloadAsync();
        return { willReload: true };
      }
    } catch (err) {
      console.warn('[i18n] Could not reload after RTL change:', err);
    }
  }

  return { willReload: false };
}

/**
 * Initialize i18n before the first render. Call this at the very top of the
 * root layout, BEFORE returning any JSX.
 */
export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) return;

  const stored = await getStoredLanguage();
  const language: SupportedLanguage = stored || detectDeviceLanguage();

  // Set RTL state before first render. If the saved language disagrees with
  // the current I18nManager state, the user will see a one-time flip on next
  // app launch — acceptable for first install.
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
      interpolation: {
        escapeValue: false, // React already escapes
      },
      returnNull: false,
    });
}

export default i18n;
