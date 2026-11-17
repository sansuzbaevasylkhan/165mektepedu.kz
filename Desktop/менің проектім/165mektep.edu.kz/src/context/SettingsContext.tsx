import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useRealtime } from '../lib/useRealtime';
import type { SocialLink } from '../types';

interface SettingsState {
  settings: Record<string, string>;
  social: SocialLink[];
  loaded: boolean;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsState>({
  settings: {}, social: [], loaded: false, reload: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [social, setSocial] = useState<SocialLink[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const d = await api.siteData();
      setSettings(d.settings);
      setSocial(d.social);
    } catch { /* баптаулар жүктелмесе, бос мәндермен жұмыс істейді */ }
    setLoaded(true);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  // Сайт баптаулары мен әлеуметтік сілтемелер — барлық бетте бірден жаңарады
  useRealtime(['site_settings', 'social_links'], () => { void reload(); });

  // Сайт баптаулары: favicon, бренд түстері, әдепкі тақырып
  useEffect(() => {
    if (typeof document === 'undefined' || !loaded) return;
    const fav = settings.favicon_url?.trim();
    if (fav) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = fav;
    }
    const primary = settings.primary_color?.trim();
    const secondary = settings.secondary_color?.trim();
    if (/^#[0-9a-f]{6}$/i.test(primary ?? '')) document.documentElement.style.setProperty('--gold', primary!);
    if (/^#[0-9a-f]{6}$/i.test(secondary ?? '')) document.documentElement.style.setProperty('--gold-2', secondary!);
    if (settings.default_theme === 'light' || settings.default_theme === 'dark') {
      window.dispatchEvent(new CustomEvent('site-theme', { detail: settings.default_theme }));
    }
  }, [settings, loaded]);

  const value = useMemo(() => ({ settings, social, loaded, reload }), [settings, social, loaded, reload]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
