import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
interface ThemeState { theme: Theme; toggle: () => void }

const ThemeContext = createContext<ThemeState>({ theme: 'dark', toggle: () => {} });

function readTheme(): Theme {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#050505' : '#FFFFFF');
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  // Басқа қойындыда немесе сайт баптауларында тақырып өзгерсе — синхрондау
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setTheme(e.newValue === 'light' ? 'light' : 'dark');
    };
    const onSite = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      if (value === 'light' || value === 'dark') setTheme(value);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('site-theme', onSite);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('site-theme', onSite);
    };
  }, []);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
