import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/Header';
import { Icon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../lib/seo';

const LINKS = [
  { to: '/direktor-admin', label: 'Сабақ кестесі', icon: 'clock' as const, end: true },
  { to: '/direktor-admin/history', label: 'Өзгерістер тарихы', icon: 'history' as const },
];

export default function DirectorLayout() {
  useSeo('Директор панелі');
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  const exit = async () => { await signOut(); nav('/direktor-admin/login', { replace: true }); };

  return (
    <div className="admin allow-copy">
      <header className="admin-top">
        <button className="icon-btn admin-burger" aria-label="Мәзірді ашу" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
        <Logo to="/direktor-admin" />
        <span className="badge badge-open admin-tag">DIRECTOR</span>
        <div className="grow" />
        <span className="muted small hide-sm">{profile?.last_name} {profile?.first_name}</span>
        <Link to="/" className="btn btn-ghost btn-sm hide-sm">Сайтқа өту</Link>
        <ThemeToggle />
        <button className="icon-btn" aria-label="Шығу" title="Шығу" onClick={() => void exit()}><Icon name="out" /></button>
      </header>

      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="admin-body">
        <aside className={`admin-nav ${open ? 'open' : ''}`} aria-label="Директор мәзірі">
          <div className="admin-nav-head">
            <span>{profile?.last_name} {profile?.first_name}</span>
            <button className="icon-btn admin-nav-close" aria-label="Мәзірді жабу" onClick={() => setOpen(false)}><Icon name="close" /></button>
          </div>
          <div className="admin-group">
            <span className="admin-group-title">Сабақ кестесі</span>
            {LINKS.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                <Icon name={i.icon} size={18} /><span>{i.label}</span>
              </NavLink>
            ))}
          </div>
          <p className="director-note">
            <Icon name="shield" size={16} />
            Кестені қосу, өзгерту және өшіру құқығы тек директорда. Әр өзгеріс тарихқа жазылады.
          </p>
          <Link to="/" className="admin-link admin-site-link"><Icon name="globe" size={18} /><span>Сайтқа өту</span></Link>
        </aside>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
