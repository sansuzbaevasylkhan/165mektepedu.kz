import { useState } from 'react';
import { Link } from 'react-router-dom';
import { about, ubtSteps } from '../content/kk';
import { NewsCard } from './NewsCard';
import { Icon, type IconName } from './Icons';
import { Reveal } from './Reveal';
import { SocialLinks } from './SocialLinks';
import { ContactList } from './Footer';
import { Empty, ErrorState, Spinner, useAsync } from './ui';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useRealtime } from '../lib/useRealtime';
import { useT } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { parseAdvantages, parseDirections } from '../lib/settings';

export function AboutSection({ title, intro }: { title?: string; intro?: string }) {
  return (
    <section className="section">
      <div className="container grid grid-2 center-y">
        <Reveal>
          <span className="eyebrow">Мектеп туралы</span>
          <h2 className="section-title left">{title?.trim() || 'Білімнің жаңа деңгейі'}</h2>
          <p>{intro?.trim() || about.intro}</p>
          <Link to="/about" className="btn btn-ghost">Толығырақ <Icon name="arrow" size={16} /></Link>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid grid-2 tight">
            {about.system.map((s) => (
              <div key={s.t} className="card pad mini"><h4>{s.t}</h4><p className="muted">{s.d}</p></div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function DirectionsSection() {
  const { settings } = useSettings();
  const blocks = parseDirections(settings.home_directions);
  const [tab, setTab] = useState('');
  const dir = blocks.find((d) => d.id === tab) ?? blocks[0];
  if (!dir) return null;
  return (
    <section className="section alt">
      <div className="container">
        <h2 className="section-title">Білім беру бағыттары</h2>
        <div className="chips" role="tablist">
          {blocks.map((d) => (
            <button key={d.id} role="tab" aria-selected={dir.id === d.id}
              className={`chip ${dir.id === d.id ? 'active' : ''}`} onClick={() => setTab(d.id)}>{d.tab}</button>
          ))}
        </div>
        <div key={dir.id} className="dir-panel fade-in">
          <p className="lead center">{dir.text}</p>
          <div className="grid grid-3">
            {dir.items.map((it) => (
              <div key={it.title} className="card pad interactive"><h4>{it.title}</h4><p className="muted">{it.text}</p></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsSection() {
  const news = useAsync(() => api.news(3), []);
  useRealtime(['news'], news.reload);
  return (
    <section className="section">
      <div className="container">
        <div className="section-row">
          <h2 className="section-title left">Соңғы жаңалықтар</h2>
          <Link to="/news" className="link-gold">Барлығы <Icon name="arrow" size={16} /></Link>
        </div>
        {news.loading ? <Spinner />
          : news.error ? <ErrorState message={friendlyError(news.error)} onRetry={news.reload} />
          : !news.data?.length ? <Empty title="Жаңалықтар әзірге жарияланбаған" />
          : <div className="grid grid-3">{news.data.map((n) => <NewsCard key={n.id} item={n} />)}</div>}
      </div>
    </section>
  );
}

export function UbtSection() {
  const t = useT();
  return (
    <section className="section alt ubt-band">
      <div className="container">
        <span className="eyebrow">{t('nav.ubt')}</span>
        <h2 className="section-title left">ҰБТ-ға дайындық платформасы</h2>
        <p className="lead">Видеосабақтар мен тесттер бір жүйеде. Әр сабақ алдыңғысы аяқталғанда ашылады — прогресс толығымен сервер жағында есептеледі.</p>
        <div className="grid grid-4">
          {ubtSteps.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div className="card pad step"><span className="step-n">{s.n}</span><h4>{s.t}</h4><p className="muted">{s.d}</p></div>
            </Reveal>
          ))}
        </div>
        <Link to="/ubt" className="btn btn-gold btn-lg">ҰБТ-ға дайындалу <Icon name="arrow" size={18} /></Link>
      </div>
    </section>
  );
}

export function AchievementsSection() {
  const student = useAsync(() => api.content('student_achievement', 6), []);
  const school = useAsync(() => api.content('achievement', 6), []);
  useRealtime(['content_items'], () => { student.reload(); school.reload(); });
  const items = [...(student.data ?? []), ...(school.data ?? [])].slice(0, 6);
  const loading = student.loading || school.loading;
  const error = student.error ?? school.error;
  const reload = () => { student.reload(); school.reload(); };
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Оқушылар және мектеп жетістіктері</h2>
        {loading ? <Spinner />
          : error ? <ErrorState message={friendlyError(error)} onRetry={reload} />
          : !items.length ? <Empty title="Жетістіктер жақында жарияланады" text="Мектеп әкімшілігі оқушылардың табыстарын осы бөлімге қосады." />
          : <div className="grid grid-3">
              {items.map((a) => (
                <Reveal key={a.id}>
                  <div className="card pad achievement"><Icon name="trophy" size={28} /><h4>{a.title}</h4>{a.subtitle && <p className="muted">{a.subtitle}</p>}</div>
                </Reveal>
              ))}
            </div>}
      </div>
    </section>
  );
}

export function AdvantagesSection() {
  const { settings } = useSettings();
  const items = parseAdvantages(settings.home_advantages);
  return (
    <section className="section alt">
      <div className="container">
        <h2 className="section-title">Мектептің артықшылықтары</h2>
        <div className="grid grid-3">
          {items.map((a, i) => (
            <Reveal key={`${a.title}-${i}`} delay={(i % 3) * 70}>
              <div className="card pad interactive adv"><div className="adv-icon"><Icon name={a.icon as IconName} size={26} /></div><h4>{a.title}</h4><p className="muted">{a.text}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SocialSection() {
  return (
    <section className="section">
      <div className="container grid grid-2">
        <div>
          <h2 className="section-title left">Әлеуметтік желілер</h2>
          <p className="muted">Мектеп жаңалықтарын әлеуметтік желілерден де қадағалаңыз.</p>
          <SocialLinks big />
        </div>
        <div>
          <h2 className="section-title left">Байланыс</h2>
          <ContactList />
        </div>
      </div>
    </section>
  );
}
