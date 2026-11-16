import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { isConfigured } from '../lib/supabase';

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function Layout() {
  return (
    <>
      <Header />
      {!isConfigured && (
        <div className="config-banner">
          Supabase бапталмаған: <code>.env</code> файлына VITE_SUPABASE_URL және VITE_SUPABASE_ANON_KEY қойыңыз.
        </div>
      )}
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
