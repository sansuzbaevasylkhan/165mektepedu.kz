import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { kk, type MsgKey } from './kk';

export type Locale = 'kk'; // болашақта: 'kk' | 'ru' | 'en'

const DICTS: Record<Locale, Record<MsgKey, string>> = { kk };

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MsgKey) => string;
}

const I18nContext = createContext<I18nState>({ locale: 'kk', setLocale: () => {}, t: (k) => kk[k] });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('kk');
  const t = useCallback((key: MsgKey) => DICTS[locale][key] ?? kk[key], [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext).t;
export const useLocale = () => useContext(I18nContext);
export type { MsgKey };
