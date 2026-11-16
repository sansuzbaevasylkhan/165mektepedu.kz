import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, errMsg } from '../lib/supabase';
import type { LessonListItem } from '../lib/types';
import { fmtDuration, useSeo } from '../lib/utils';
import { Empty, ErrorBox, ProgressBar, Spinner } from '../components/ui';

export default function SubjectPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [lessons, setLessons] = useState<LessonListItem[] | null>(null);
  const [err, setErr] = useState('');
  useSeo(title || 'Сабақтар');

  const load = useCallback(async () => {
    const [l, s] = await Promise.all([
      supabase.rpc('get_subject_lessons', { p_subject: id }),
      supabase.from('subjects').select('title').eq('id', id ?? '').maybeSingle(),
    ]);
    if (l.error) return setErr(errMsg(l.error));
    setErr('');
    setLessons(l.data as LessonListItem[]);
    setTitle((s.data as { title: string } | null)?.title ?? '');
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const done = lessons?.filter((l) => l.completed).length ?? 0;
  const pct = lessons && lessons.length ? Math.round((done * 100) / lessons.length) : 0;

  return (
    <div className="container page narrow">
      <Link to="/ubt" className="back">← Пәндер</Link>
      <div className="page-head left">
        <h1>{title || 'Сабақтар'}</h1>
      </div>
      {err && <ErrorBox message={err} onRetry={load} />}
      {!lessons && !err && <Spinner />}
      {lessons && lessons.length === 0 && <Empty title="Бұл пәнге сабақ әзірге қосылмаған" />}
      {lessons && lessons.length > 0 && (
        <>
          <div className="card total-progress">
            <div className="tp-head"><b>Пән прогресі</b><span>{done} / {lessons.length} · {pct}%</span></div>
            <ProgressBar value={pct} />
          </div>
          <ol className="lesson-list">
            {lessons.map((l, i) => {
              const status = l.completed ? 'Аяқталды' : l.locked ? 'Жабық' : 'Ашық';
              return (
                <li key={l.id} className={`lesson-item ${l.locked ? 'locked' : ''} ${l.completed ? 'done' : ''}`}>
                  <div className="lesson-num">{l.completed ? '✓' : l.locked ? '🔒' : i + 1}</div>
                  <div className="lesson-main">
                    <div className="lesson-title">
                      <h3>{l.title}</h3>
                      <span className={`badge ${l.completed ? 'ok' : l.locked ? 'lock' : 'open'}`}>{status}</span>
                    </div>
                    {l.description && <p>{l.description}</p>}
                    <div className="lesson-stats">
                      <span>Видео: <b>{l.video_percent}%</b></span>
                      <span>Тест: <b>{l.has_test ? (l.test_passed ? '100%' : l.best_percent != null ? `${Math.round(l.best_percent)}%` : '—') : 'жоқ'}</b></span>
                      <span>⏱ {fmtDuration(l.duration_seconds)}</span>
                    </div>
                    <ProgressBar value={l.completed ? 100 : l.video_percent / (l.has_test ? 2 : 1)} />
                  </div>
                  <button
                    className={`btn btn-sm ${l.locked ? 'btn-ghost' : 'btn-gold'}`}
                    disabled={l.locked}
                    onClick={() => nav(`/ubt/lesson/${l.id}`)}
                    title={l.locked ? 'Алдыңғы сабақты толық аяқтаңыз' : ''}
                  >
                    {l.completed ? 'Қайта көру' : l.video_percent > 0 ? 'Жалғастыру' : 'Бастау'}
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
