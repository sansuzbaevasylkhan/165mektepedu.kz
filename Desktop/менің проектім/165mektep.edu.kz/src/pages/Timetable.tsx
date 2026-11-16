import { useMemo, useState } from 'react';
import { ErrorState, Spinner, useAsync } from '../components/ui';
import { TimetableBoard } from '../components/TimetableBoard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useSeo } from '../lib/seo';
import { useTimetableRealtime } from '../lib/useTimetableRealtime';

/** Мұғалім (және басқа staff) үшін кестені қайта жүктемей көру: Realtime автоматты жаңартады. */
export default function Timetable() {
  const { isTeacher, profile } = useAuth();
  const [query, setQuery] = useState('');
  const { data, error, loading, reload } = useAsync(api.timetable, []);
  useTimetableRealtime(reload);

  const entries = data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.teacher_name, e.subject_title, e.class_name, e.room]
        .some((v) => v.toLowerCase().includes(q)));
  }, [entries, query]);

  return (
    <section className="page">
      <div className="container stack-lg">
        <div className="section-row">
          <div>
            <h1>{isTeacher ? 'Менің сабақ кестем' : 'Сабақ кестесі'}</h1>
            <p className="muted small">
              {isTeacher
                ? `${profile?.last_name ?? ''} ${profile?.first_name ?? ''} — сізге қатысты сабақтар. Кесте өзгергенде бетті қайта жүктемей-ақ автоматты жаңарады.`
                : 'Мектептің ағымдағы сабақ кестесі. Өзгерістер автоматты түрде көрсетіледі.'}
            </p>
          </div>
          <span className="badge badge-open">{entries.length} сабақ</span>
        </div>

        <div className="card pad">
          <div className="toolbar">
            <input className="input search" aria-label="Кестеден іздеу"
              placeholder="Пән, сынып немесе кабинет бойынша іздеу"
              value={query} onChange={(e) => setQuery(e.target.value)} />
            <span className="muted small">{filtered.length} / {entries.length} жазба</span>
          </div>
        </div>

        {loading && !data && <Spinner />}
        {error != null && <ErrorState message={friendlyError(error)} onRetry={reload} />}
        {!loading && error == null && (
          <TimetableBoard
            entries={filtered}
            showTeacher={!isTeacher}
            emptyText={isTeacher ? 'Сізге әзірге сабақ тағайындалмаған.' : 'Кесте әзірге бос.'}
          />
        )}
      </div>
    </section>
  );
}
