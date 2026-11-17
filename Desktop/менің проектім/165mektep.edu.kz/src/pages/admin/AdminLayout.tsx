import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/Header';
import { NotificationsBell } from '../../components/NotificationsBell';
import { Icon, type IconName } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../lib/seo';

interface NavItem { to: string; label: string; icon: IconName; end?: boolean }
interface NavGroup { title: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    title: 'Мұғалімдер',
    items: [
      { to: '/admin', label: 'Басты панель', icon: 'chart', end: true },
      { to: '/admin/teachers', label: 'Мұғалімдер тізімі', icon: 'users' },
      { to: '/admin/subjects', label: 'Пәндер мен мұғалімдер', icon: 'book' },
      { to: '/admin/teachers/new', label: 'Жаңа мұғалім', icon: 'plus' },
      { to: '/admin/tasks', label: 'Тапсырмалар', icon: 'clipboard' },
    ],
  },
  {
    title: 'Бақылау',
    items: [
      { to: '/admin/teacher-audit', label: 'Audit журналы', icon: 'history' },
    ],
  },
];

export default function AdminLayout() {
  useSeo('Әкімші панелі');
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  const signOutAdmin = async () => { await signOut(); nav('/admin/login', { replace: true }); };
  const isActive = (i: NavItem) => {
    if (i.to === '/admin/teachers') {
      return pathname === i.to || (pathname.startsWith(`${i.to}/`) && !pathname.endsWith('/new'));
    }
    return i.end ? pathname === i.to : pathname.startsWith(i.to);
  };

  return (
    <div className="admin allow-copy">
      <header className="admin-top">
        <button className="icon-btn admin-burger" aria-label="Мәзірді ашу" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
        <Logo to="/admin" />
        <span className="badge badge-open admin-tag">ADMIN</span>
        <div className="grow" />
        <span className="muted small hide-sm">{profile?.last_name} {profile?.first_name}</span>
        <Link to="/" className="btn btn-ghost btn-sm hide-sm">Сайтқа өту</Link>
        <NotificationsBell />
        <ThemeToggle />
        <button className="icon-btn" aria-label="Шығу" title="Шығу" onClick={() => void signOutAdmin()}><Icon name="out" /></button>
      </header>

      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="admin-body">
        <aside className={`admin-nav ${open ? 'open' : ''}`} aria-label="Админ мәзірі">
          <div className="admin-nav-head">
            <span>{profile?.last_name} {profile?.first_name}</span>
            <button className="icon-btn admin-nav-close" aria-label="Мәзірді жабу" onClick={() => setOpen(false)}><Icon name="close" /></button>
          </div>
          {GROUPS.map((g) => (
            <div key={g.title} className="admin-group">
              <span className="admin-group-title">{g.title}</span>
              {g.items.map((i) => (
                <Link key={i.to} to={i.to} className={`admin-link ${isActive(i) ? 'active' : ''}`}>
                  <Icon name={i.icon} size={18} /><span>{i.label}</span>
                </Link>
              ))}
            </div>
          ))}
          <p className="director-note">
            <Icon name="shield" size={16} />
            ADMIN тек мұғалімдерді басқарады. Оқушы/ата-ана кабинеттеріне және DIRECTOR панеліне кіру мүмкіндігі жоқ —
            бұл серверде тексеріледі.
          </p>
          <Link to="/" className="admin-link admin-site-link"><Icon name="globe" size={18} /><span>Сайтқа өту</span></Link>
        </aside>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
