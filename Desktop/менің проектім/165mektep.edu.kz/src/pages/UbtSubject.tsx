import { Link, useParams } from 'react-router-dom';
import { Empty, ErrorState, ProgressBar, Spinner, useAsync } from '../components/ui';
import { LessonRow } from '../components/LessonRow';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useRealtime } from '../lib/useRealtime';
import { overallPercent } from '../lib/util';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';

export default function UbtSubject() {
  const t = useT();
  const { subjectId = '' } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.catalog(), []);
  useRealtime(['subjects', 'lessons', 'tests', 'lesson_progress', 'test_attempts'], reload);
  const subject = data?.subjects.find((s) => s.id === subjectId);
  useSeo(subject?.title ?? t('ubt.title'), undefined, `/ubt/${subjectId}`);

  if (loading) return <Spinner />;
  if (error || !data) return <section className="container page"><ErrorState message={friendlyError(error)} onRetry={reload} /></section>;
  if (!subject) return <section className="container page"><Empty title="Пән табылмады" action={<Link to="/ubt" className="btn btn-gold">{t('nav.ubt')}</Link>} /></section>;

  const lessons = data.lessons
    .filter((l) => l.subject_id === subjectId)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="container page narrow-lg">
      <Link to="/ubt" className="back-link"><Icon name="arrow" size={16} /> {t('ubt.subjects')}</Link>
      <h1>{subject.title}</h1>
      {subject.description && <p className="muted">{subject.description}</p>}
      {lessons.length > 0 && <ProgressBar value={overallPercent(lessons)} label={t('ubt.progress')} />}
      <div className="lesson-list">
        {lessons.length === 0
          ? <Empty title={t('ubt.noLessons')} />
          : lessons.map((l, i) => <LessonRow key={l.lesson_id} lesson={l} index={i} />)}
      </div>
    </section>
  );
}
