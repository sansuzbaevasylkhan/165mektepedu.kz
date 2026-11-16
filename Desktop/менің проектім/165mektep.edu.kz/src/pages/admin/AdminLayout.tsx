import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/Header';
import { Icon, type IconName } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../lib/seo';

interface NavItem { to: string; label: string; icon: IconName; end?: boolean }
interface NavGroup { title: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    title: 'Негізгі',
    items: [
      { to: '/admin', label: 'Басты панель', icon: 'chart', end: true },
      { to: '/admin/students', label: 'Оқушылар', icon: 'cap' },
      { to: '/admin/parents', label: 'Ата-аналар', icon: 'users' },
    ],
  },
  {
    title: 'Мазмұн',
    items: [
      { to: '/admin/news', label: 'Жаңалықтар', icon: 'news' },
      { to: '/admin/about', label: 'Мектеп туралы', icon: 'book' },
      { to: '/admin/gallery', label: 'Галерея', icon: 'image' },
      { to: '/admin/timetable', label: 'Сабақ кестесі', icon: 'clock' },
    ],
  },
  {
    title: 'ҰБТ басқару',
    items: [
      { to: '/admin/ubt/subjects', label: 'Пәндер', icon: 'layers' },
      { to: '/admin/ubt/lessons', label: 'Видеосабақтар', icon: 'video' },
      { to: '/admin/ubt/tests', label: 'Тесттер', icon: 'file' },
      { to: '/admin/progress', label: 'Оқушылар прогресі', icon: 'cap' },
    ],
  },
  {
    title: 'Аналитика',
    items: [
      { to: '/admin/stats', label: 'Статистика', icon: 'chart' },
      { to: '/admin/logs', label: 'Әрекеттер тарихы', icon: 'history' },
    ],
  },
  {
    title: 'Сайт',
    items: [
      { to: '/admin/home', label: 'Басты бетті басқару', icon: 'home' },
      { to: '/admin/footer', label: 'Footer басқару', icon: 'grid' },
      { to: '/admin/social', label: 'Әлеуметтік желілер', icon: 'link' },
      { to: '/admin/apps', label: 'Google Play / App Store', icon: 'smartphone' },
      { to: '/admin/site', label: 'Сайт баптаулары', icon: 'settings' },
      { to: '/admin/security', label: 'Қауіпсіздік', icon: 'shield' },
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
                <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                  <Icon name={i.icon} size={18} /><span>{i.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
          <Link to="/" className="admin-link admin-site-link"><Icon name="globe" size={18} /><span>Сайтқа өту</span></Link>
        </aside>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
