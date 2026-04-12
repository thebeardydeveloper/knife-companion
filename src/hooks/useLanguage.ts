import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import type { Language } from '../i18n/index';

export function useLanguage() {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguageInStore = useAppStore((s) => s.setLanguage);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageInStore(lang);
      i18n.changeLanguage(lang);
    },
    [i18n, setLanguageInStore]
  );

  return { language, setLanguage };
}
