import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { VideoPlayer } from '../components/VideoPlayer';
import { TestRunner } from '../components/TestRunner';
import { Empty, ErrorState, ProgressBar, Spinner } from '../components/ui';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';
import type { LessonDetail, TestResult } from '../types';

export default function Lesson() {
  const t = useT();
  const { lessonId = '' } = useParams();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);

  useSeo(lesson?.title ?? t('ubt.lesson'), undefined, `/ubt/lesson/${lessonId}`);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null); setLocked(false); setLesson(null);
    api.lesson(lessonId)
      .then((l) => alive && setLesson(l))
      .catch((e) => {
        if (!alive) return;
        const msg = (e as { message?: string })?.message ?? '';
        if (msg.includes('LESSON_LOCKED')) setLocked(true);
        else setError(friendlyError(e));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [lessonId]);

  // Видео прогресін серверге жіберу. Нәтижені тек сервер анықтайды.
  const report = useCallback((position: number) => {
    if (busy.current) return;
    busy.current = true;
    api.reportProgress(lessonId, position)
      .then((r) => setLesson((l) => l && {
        ...l,
        video_percent: Math.max(l.video_percent, r.video_percent),
        video_completed: l.video_completed || r.video_completed,
        completed: l.completed || r.completed,
      }))
      .catch(() => { /* уақытша қате — келесі есепте қайталанады */ })
      .finally(() => { busy.current = false; });
  }, [lessonId]);

  const onTest = (r: TestResult) => {
    setLesson((l) => l && {
      ...l,
      test_passed: l.test_passed || r.passed,
      best_score: Math.max(l.best_score, r.percent),
      completed: l.completed || (r.passed && l.video_completed),
    });
  };

  if (loading) return <Spinner />;
  if (locked) {
    return (
      <section className="container page">
        <Empty title={t('ubt.lockedTitle')} text={t('ubt.lockedText')}
          action={<Link to="/ubt" className="btn btn-gold">{t('ubt.subjects')}</Link>} />
      </section>
    );
  }
  if (error || !lesson) return <section className="container page"><ErrorState message={error ?? 'Сабақ табылмады'} /></section>;

  const testPct = lesson.has_test ? (lesson.test_passed ? 100 : lesson.best_score) : 100;

  return (
    <section className="container page lesson-page">
      <Link to={`/ubt/${lesson.subject_id}`} className="back-link"><Icon name="arrow" size={16} /> {lesson.subject_title}</Link>
      <h1>{lesson.title}</h1>

      <div className="lesson-layout">
        <div className="lesson-content">
          <VideoPlayer key={lesson.id} kind={lesson.video_kind} url={lesson.video_url} path={lesson.video_path}
            startAt={lesson.start_position} onReport={report} />

          {lesson.description && (
            <div className="card pad">
              <h3>Сабақтың сипаттамасы</h3>
              {lesson.description.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}

          {lesson.has_test && (
            <div className="card pad test-card">
              {lesson.video_completed
                ? <TestRunner lessonId={lesson.id} onFinished={onTest} />
                : (<><h3>{t('ubt.test')}</h3><p className="muted"><Icon name="lock" size={16} /> {t('ubt.watchFirst')}</p></>)}
            </div>
          )}
        </div>

        <aside className="lesson-aside card pad">
          <h3>Орындалу көрсеткіші</h3>
          <ProgressBar value={lesson.video_percent} label={`${t('ubt.video')}`} />
          {lesson.has_test && <ProgressBar value={testPct} label={t('ubt.test')} />}
          <ul className="status-list">
            <li><span>{t('ubt.lesson')}</span><b className={lesson.completed ? 'ok' : ''}>{lesson.completed ? t('ubt.done') : t('ubt.inProgress')}</b></li>
            <li><span>{t('ubt.nextLesson')}</span>
              <b className={lesson.completed ? 'ok' : ''}>
                {lesson.next_lesson_id ? (lesson.completed ? t('ubt.open') : t('ubt.locked')) : '—'}
              </b>
            </li>
          </ul>
          {lesson.completed && lesson.next_lesson_id && (
            <Link to={`/ubt/lesson/${lesson.next_lesson_id}`} className="btn btn-gold btn-block">
              {t('ubt.nextLesson')} <Icon name="arrow" size={16} />
            </Link>
          )}
          {lesson.completed && !lesson.next_lesson_id && (
            <Link to={`/ubt/${lesson.subject_id}`} className="btn btn-gold btn-block">{t('ubt.subjects')}</Link>
          )}
        </aside>
      </div>
    </section>
  );
}
