import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lang: string) => void) => {
    const locale = Localization.getLocales()?.[0]?.languageCode || 'en';
    callback(locale);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error('Failed to initialize i18n', error);
  });

export default i18n;

