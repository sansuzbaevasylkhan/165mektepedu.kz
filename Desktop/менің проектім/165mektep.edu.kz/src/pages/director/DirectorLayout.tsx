import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/Header';
import { NotificationsBell } from '../../components/NotificationsBell';
import { Icon, type IconName } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../lib/seo';

interface DirectorLink { to: string; label: string; icon: IconName; end?: boolean; search?: string }
interface DirectorGroup { title: string; items: DirectorLink[]; isNew?: boolean }

const GROUPS: DirectorGroup[] = [
  {
    title: 'Негізгі',
    items: [
      { to: '/direktor-admin', label: 'Басты панель', icon: 'chart', end: true },
      { to: '/direktor-admin/admissions', label: 'Оқушыларды қабылдау', icon: 'cap' },
    ],
  },
  {
    title: 'Құжаттар орталығы',
    isNew: true,
    items: [
      { to: '/direktor-admin/documents', label: 'Құжат талаптары', icon: 'file', search: '' },
      { to: '/direktor-admin/documents', label: 'Міндетті құжаттар', icon: 'check', search: 'required' },
      { to: '/direktor-admin/documents', label: 'Тексеру', icon: 'eye', search: 'review' },
      { to: '/direktor-admin/documents', label: 'Басқару', icon: 'settings', search: 'manage' },
    ],
  },
  {
    title: 'Сабақ кестесі',
    items: [
      { to: '/direktor-admin/timetable', label: 'Сабақ кестесі', icon: 'clock' },
      { to: '/direktor-admin/history', label: 'Өзгерістер тарихы', icon: 'history' },
    ],
  },
  {
    title: 'Мұғалімдер',
    items: [
      { to: '/direktor-admin/teachers', label: 'Мұғалімдер тізімі', icon: 'users' },
      { to: '/direktor-admin/academics', label: 'Пәндер мен жүктеме', icon: 'book' },
      { to: '/direktor-admin/tasks', label: 'Тапсырмалар', icon: 'clipboard' },
      { to: '/direktor-admin/teacher-audit', label: 'Мұғалім audit', icon: 'history' },
    ],
  },
  {
    title: 'Басқару',
    items: [
      { to: '/direktor-admin/admins', label: 'Әкімші рұқсаттары', icon: 'key' },
    ],
  },
];

export default function DirectorLayout() {
  useSeo('Директор панелі');
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname, search]);
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  const active = (i: DirectorLink) => {
    if (i.search !== undefined) {
      if (pathname !== '/direktor-admin/documents') return false;
      const tab = new URLSearchParams(search).get('tab') ?? '';
      return tab === i.search;
    }
    return i.end ? pathname === i.to : pathname.startsWith(i.to);
  };

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
        <NotificationsBell />
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
          {GROUPS.map((g) => (
            <div key={g.title} className="admin-group">
              <span className="admin-group-title">
                {g.title}
                {g.isNew && <span className="nav-new">NEW</span>}
              </span>
              {g.items.map((i) => (
                <Link key={`${i.to}-${i.search ?? 'base'}`} to={i.search ? `${i.to}?tab=${i.search}` : i.to}
                  className={`admin-link ${active(i) ? 'active' : ''}`}>
                  <Icon name={i.icon} size={18} /><span>{i.label}</span>
                </Link>
              ))}
            </div>
          ))}
          <p className="director-note">
            <Icon name="shield" size={16} />
            Құжаттар жеке сақталады. Шешім қабылдау және тексеру құқығы директор мен әкімшіде. Әр әрекет тарихқа жазылады.
          </p>
          <Link to="/" className="admin-link admin-site-link"><Icon name="globe" size={18} /><span>Сайтқа өту</span></Link>
        </aside>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
