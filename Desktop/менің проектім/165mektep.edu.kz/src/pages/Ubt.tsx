import { Link } from 'react-router-dom';
import { Empty, ErrorState, ProgressBar, Ring, Spinner, useAsync } from '../components/ui';
import { Reveal } from '../components/Reveal';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { overallPercent, lessonPercent } from '../lib/util';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';

export default function Ubt() {
  const t = useT();
  useSeo(t('ubt.title'), 'ҰБТ-ға дайындық: пәндер бойынша видеосабақтар мен тесттер.', '/ubt');
  const { data, error, loading, reload } = useAsync(() => api.catalog(), []);

  if (loading) return <Spinner />;
  if (error || !data) return <section className="container page"><ErrorState message={friendlyError(error)} onRetry={reload} /></section>;

  const withLessons = data.subjects.filter((s) => data.lessons.some((l) => l.subject_id === s.id));
  const overall = overallPercent(data.lessons);
  const done = data.lessons.filter((l) => l.completed).length;

  return (
    <section className="container page">
      <header className="page-head">
        <span className="eyebrow">{t('nav.ubt')}</span>
        <h1>{t('ubt.title')}</h1>
        <p className="muted">Видеосабақты көріңіз, тест тапсырыңыз — келесі сабақ ашылады.</p>
      </header>

      <div className="card pad overall">
        <Ring value={overall} />
        <div className="overall-info">
          <h3>{t('ubt.progress')}</h3>
          <p className="muted">{done} / {data.lessons.length} {t('ubt.lessons').toLowerCase()} аяқталды</p>
          <ProgressBar value={overall} />
        </div>
      </div>

      <h2 className="section-title left">{t('ubt.subjects')}</h2>
      {withLessons.length === 0 ? (
        <Empty title="Сабақтар әзірге қосылмаған" text="Әкімшілік видеосабақтарды жақында жариялайды." />
      ) : (
        <div className="grid grid-3">
          {withLessons.map((s, i) => {
            const ls = data.lessons.filter((l) => l.subject_id === s.id);
            const pct = Math.round(ls.reduce((a, l) => a + lessonPercent(l), 0) / ls.length);
            return (
              <Reveal key={s.id} delay={(i % 3) * 60}>
                <Link to={`/ubt/${s.id}`} className="card pad interactive subject-card">
                  <div className="adv-icon"><Icon name="book" size={26} /></div>
                  <h3>{s.title}</h3>
                  <p className="muted small">{ls.filter((l) => l.completed).length} / {ls.length} {t('ubt.lessons').toLowerCase()}</p>
                  <ProgressBar value={pct} slim />
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
