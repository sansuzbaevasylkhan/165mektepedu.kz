import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { SocialLink } from './types';

export const SETTING_KEYS = [
  'school_address',
  'school_phone',
  'school_email',
  'google_play_url',
  'app_store_url',
  'hero_image_url',
  'about_history',
  'about_mission',
  'about_goal',
  'about_system',
  'about_teachers',
  'about_achievements',
  'about_student_achievements',
  'gallery_urls',
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

interface SettingsCtx {
  settings: Partial<Record<SettingKey, string>>;
  social: SocialLink[];
  loading: boolean;
  reload: () => Promise<void>;
}

const Ctx = createContext<SettingsCtx | null>(null);
const ORDER = ['instagram', 'tiktok', 'youtube', 'facebook'];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<Record<SettingKey, string>>>({});
  const [social, setSocial] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [s, l] = await Promise.all([
      supabase.from('site_settings').select('key,value'),
      supabase.from('social_links').select('*'),
    ]);
    if (s.data) {
      const m: Partial<Record<SettingKey, string>> = {};
      for (const r of s.data as { key: SettingKey; value: string }[]) m[r.key] = r.value;
      setSettings(m);
    }
    if (l.data) {
      setSocial((l.data as SocialLink[]).sort((a, b) => ORDER.indexOf(a.platform) - ORDER.indexOf(b.platform)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ settings, social, loading, reload }), [settings, social, loading, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSettings must be used inside SettingsProvider');
  return c;
}

export const lines = (v?: string) =>
  (v ?? '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
