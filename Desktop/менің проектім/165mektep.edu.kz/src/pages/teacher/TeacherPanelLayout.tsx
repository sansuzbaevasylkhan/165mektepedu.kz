import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../../components/Icons';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/Header';
import { NotificationsBell } from '../../components/NotificationsBell';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../lib/seo';

interface PanelLink { to: string; label: string; icon: IconName; end?: boolean }
interface PanelGroup { title: string; items: PanelLink[] }

const GROUPS: PanelGroup[] = [
  {
    title: 'Негізгі',
    items: [
      { to: '/teacher', label: 'Басты панель', icon: 'chart', end: true },
      { to: '/teacher/subjects', label: 'Менің пәндерім', icon: 'book' },
    ],
  },
  {
    title: 'Оқу процесі',
    items: [
      { to: '/teacher/assignments', label: 'Тапсырмалар', icon: 'clipboard' },
      { to: '/teacher/tests', label: 'Онлайн тесттер', icon: 'check' },
      { to: '/teacher/materials', label: 'Оқу материалдары', icon: 'file' },
      { to: '/teacher/journal', label: 'Электрондық журнал', icon: 'grid' },
      { to: '/teacher/messages', label: 'Хабарламалар', icon: 'mail' },
      { to: '/teacher/reports', label: 'Апталық есеп', icon: 'file' },
    ],
  },
  {
    title: 'Әкімшілік',
    items: [
      { to: '/teacher/tasks', label: 'Әкімшілік тапсырмалары', icon: 'check' },
    ],
  },
];

export default function TeacherPanelLayout() {
  useSeo('Мұғалім панелі');
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  const exit = async () => { await signOut(); nav('/login', { replace: true }); };
  const isActive = (i: PanelLink) => (i.end ? pathname === i.to : pathname.startsWith(i.to));

  return (
    <div className="admin allow-copy">
      <header className="admin-top">
        <button className="icon-btn admin-burger" aria-label="Мәзірді ашу" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
        <Logo to="/teacher" />
        <span className="badge badge-open admin-tag">TEACHER</span>
        <div className="grow" />
        <span className="muted small hide-sm">{profile?.last_name} {profile?.first_name}</span>
        <Link to="/timetable" className="btn btn-ghost btn-sm hide-sm"><Icon name="clock" size={15} /> Кесте</Link>
        <NotificationsBell />
        <ThemeToggle />
        <button className="icon-btn" aria-label="Шығу" title="Шығу" onClick={() => void exit()}><Icon name="out" /></button>
      </header>

      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="admin-body">
        <aside className={`admin-nav ${open ? 'open' : ''}`} aria-label="Мұғалім мәзірі">
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
            Сіз тек өзіңізге бекітілген пәндер мен сыныптарға қол жеткізесіз. Басқа мұғалімнің деректері жабық —
            бұл серверде (RLS) тексеріледі.
          </p>
          <Link to="/" className="admin-link admin-site-link"><Icon name="globe" size={18} /><span>Сайтқа өту</span></Link>
        </aside>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
