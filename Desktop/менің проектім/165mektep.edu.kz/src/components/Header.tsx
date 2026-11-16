import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Icon } from './Icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const t = useT();
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
  return (
    <button className="icon-btn theme-toggle" onClick={toggle} aria-label={label} title={label}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export function Header() {
  const t = useT();
  const { profile, isAdmin, isDirector, isTeacher, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const logout = async () => { await signOut(); nav('/'); };
  const cls = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`;

  const links = (
    <>
      <NavLink to="/" end className={cls}>{t('nav.home')}</NavLink>
      <NavLink to="/news" className={cls}>{t('nav.news')}</NavLink>
      <NavLink to="/about" className={cls}>{t('nav.about')}</NavLink>
      <NavLink to="/ubt" className={cls}>{t('nav.ubt')}</NavLink>
      {profile ? (
        <>
          {isAdmin && <NavLink to="/admin" className={cls}>{t('nav.admin')}</NavLink>}
          {isDirector && <NavLink to="/direktor-admin" className={cls}>{t('nav.director')}</NavLink>}
          {isTeacher && <NavLink to="/timetable" className={cls}>{t('nav.timetable')}</NavLink>}
          {!isDirector && !isTeacher && <NavLink to="/cabinet" className={cls}>{t('nav.cabinet')}</NavLink>}
          <button className="nav-link nav-btn" onClick={logout}>{t('nav.logout')}</button>
        </>
      ) : (
        <>
          <NavLink to="/register" className={cls}>{t('nav.register')}</NavLink>
          <NavLink to="/login" className="btn btn-gold btn-sm">{t('nav.login')}</NavLink>
        </>
      )}
    </>
  );

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-inner">
        <Logo />
        <nav className="nav-desktop" aria-label="Негізгі мәзір">{links}</nav>
        <div className="header-actions">
          <ThemeToggle />
          <button className="icon-btn burger" onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('nav.close') : t('nav.menu')} aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>
      <div className={`drawer-back ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer glass ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <Link to="/" className="logo"><span className="logo-text">165 <b>MEKTEP</b></span></Link>
        </div>
        <nav className="drawer-nav" aria-label="Мобильді мәзір">{links}</nav>
      </aside>
    </header>
  );
}
