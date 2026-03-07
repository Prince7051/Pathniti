import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Enhanced useTranslation hook with additional utilities
 */
export function useTranslation(namespace?: string) {
  const { t, i18n, ready } = useI18nTranslation(namespace);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('preferred-language', language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const isLanguageSupported = (language: string) => {
    return i18n.hasResourceBundle(language, namespace || 'translation');
  };

  const getSupportedLanguages = () => {
    return i18n.languages;
  };

  return {
    t,
    i18n,
    ready,
    changeLanguage,
    getCurrentLanguage,
    isLanguageSupported,
    getSupportedLanguages,
  };
}

export default useTranslation;
