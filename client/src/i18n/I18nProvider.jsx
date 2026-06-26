import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyTranslations,
  getLanguage,
  LANGUAGES,
  onLanguageChange,
  setLanguage,
  t as translate
} from '../../../js/i18n.js';
import { COMPANY_NAME } from '../config/company.js';

const I18nContext = createContext({
  lang: 'en',
  t: translate,
  setLanguage,
  languages: LANGUAGES
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => getLanguage());

  useEffect(() => {
    setLanguage(getLanguage(), { silent: true });
    return onLanguageChange((code) => setLang(code));
  }, []);

  useEffect(() => {
    document.title = COMPANY_NAME || translate('app.title');
    applyTranslations(document);
  }, [lang]);

  const t = useCallback((key, vars) => translate(key, vars), [lang]);

  const changeLanguage = useCallback((code) => {
    setLanguage(code);
    setLang(code);
  }, []);

  const value = useMemo(
    () => ({ lang, t, setLanguage: changeLanguage, languages: LANGUAGES }),
    [lang, t, changeLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
