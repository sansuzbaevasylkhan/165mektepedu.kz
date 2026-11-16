import { useState } from 'react';
import { about } from '../content/kk';
import { Empty, ErrorState, Modal, Spinner, useAsync } from '../components/ui';
import { Reveal } from '../components/Reveal';
import { ContactList } from '../components/Footer';
import { SocialLinks } from '../components/SocialLinks';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useSeo } from '../lib/seo';
import { useSettings } from '../context/SettingsContext';
import { lines, parseJson, type AboutContent } from '../lib/settings';
import type { ContentItem } from '../types';

function PersonCard({ item }: { item: ContentItem }) {
  return (
    <div className="card person">
      <div className="avatar">
        {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : <Icon name="users" size={34} />}
      </div>
      <h4>{item.title}</h4>
      {item.subtitle && <p className="muted">{item.subtitle}</p>}
    </div>
  );
}

function AchievementGrid({ items }: { items: ContentItem[] }) {
  return (
    <div className="grid grid-3">
      {items.map((a) => (
        <div key={a.id} className="card pad achievement">
          <Icon name="trophy" size={28} />
          <h4>{a.title}</h4>
          {a.subtitle && <p className="muted">{a.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}

export default function About() {
  useSeo('Мектеп туралы', '165 MEKTEP: мектеп тарихы, миссиясы, мақсаты, білім беру жүйесі, мұғалімдер және жетістіктер.', '/about');
  const { settings } = useSettings();
  const saved = parseJson<AboutContent>(settings.about_content, {});
  const intro = saved.intro?.trim() || about.intro;
  const history = lines(saved.history, about.history);
  const mission = saved.mission?.trim() || about.mission;
  const goal = saved.goal?.trim() || about.goal;
  const teachers = useAsync(() => api.content('teacher'), []);
  const schoolAchievements = useAsync(() => api.content('achievement'), []);
  const studentAchievements = useAsync(() => api.content('student_achievement'), []);
  const gallery = useAsync(() => api.content('gallery'), []);
  const [photo, setPhoto] = useState<ContentItem | null>(null);

  return (
    <>
      <section className="container page">
        <header className="page-head">
          <span className="eyebrow">165 MEKTEP</span>
          <h1>Мектеп туралы</h1>
          <p className="lead">{intro}</p>
        </header>

        <div className="grid grid-2">
          <Reveal><article className="card pad"><h2>Мектеп тарихы</h2>{history.map((p, i) => <p key={i}>{p}</p>)}</article></Reveal>
          <Reveal delay={80}>
            <div className="stack">
              <article className="card pad accent"><h2>Миссиямыз</h2><p>{mission}</p></article>
              <article className="card pad"><h2>Мақсатымыз</h2><p>{goal}</p></article>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2 className="section-title">Білім беру жүйесі</h2>
          <div className="grid grid-4">
            {about.system.map((s, i) => (
              <Reveal key={s.t} delay={i * 70}><div className="card pad"><h4>{s.t}</h4><p className="muted">{s.d}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Мұғалімдер</h2>
          {teachers.loading ? <Spinner />
            : teachers.error ? <ErrorState message={friendlyError(teachers.error)} onRetry={teachers.reload} />
            : !teachers.data?.length ? <Empty title="Мұғалімдер тізімі жақында толтырылады" />
            : <div className="grid grid-4">{teachers.data.map((x) => <PersonCard key={x.id} item={x} />)}</div>}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2 className="section-title">Мектеп жетістіктері</h2>
          {schoolAchievements.loading ? <Spinner />
            : schoolAchievements.error ? <ErrorState message={friendlyError(schoolAchievements.error)} onRetry={schoolAchievements.reload} />
            : !schoolAchievements.data?.length ? <Empty title="Мектеп жетістіктері жақында жарияланады" />
            : <AchievementGrid items={schoolAchievements.data} />}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Оқушылардың жетістіктері</h2>
          {studentAchievements.loading ? <Spinner />
            : studentAchievements.error ? <ErrorState message={friendlyError(studentAchievements.error)} onRetry={studentAchievements.reload} />
            : !studentAchievements.data?.length ? <Empty title="Оқушылар жетістіктері жақында жарияланады" text="Олимпиада, байқау және жарыстардағы табыстар осы бөлімде көрсетіледі." />
            : <AchievementGrid items={studentAchievements.data} />}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2 className="section-title">Фотогалерея</h2>
          {gallery.loading ? <Spinner />
            : gallery.error ? <ErrorState message={friendlyError(gallery.error)} onRetry={gallery.reload} />
            : !gallery.data?.length ? <Empty title="Фотогалерея жақында толтырылады" />
            : <div className="gallery">
                {gallery.data.map((g) => (
                  <button key={g.id} className="gallery-item" onClick={() => setPhoto(g)} aria-label={g.title || 'Фото'}>
                    {g.image_url && <img src={g.image_url} alt={g.title} loading="lazy" />}
                  </button>
                ))}
              </div>}
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-2">
          <div>
            <h2 className="section-title left">Байланыс ақпараты</h2>
            <ContactList />
          </div>
          <div>
            <h2 className="section-title left">Әлеуметтік желілер</h2>
            <SocialLinks big />
          </div>
        </div>
      </section>

      {photo && (
        <Modal title={photo.title || 'Фото'} onClose={() => setPhoto(null)} wide>
          {photo.image_url && <img src={photo.image_url} alt={photo.title} className="lightbox" />}
          {photo.subtitle && <p className="muted">{photo.subtitle}</p>}
        </Modal>
      )}
    </>
  );
}
