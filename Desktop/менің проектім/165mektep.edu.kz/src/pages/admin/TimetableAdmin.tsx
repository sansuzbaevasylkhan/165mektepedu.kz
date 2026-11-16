import { useMemo, useState } from 'react';
import { ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { TimetableBoard, weekdayName } from '../../components/TimetableBoard';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useSeo } from '../../lib/seo';
import { useTimetableRealtime } from '../../lib/useTimetableRealtime';

/** ADMIN үшін тек оқу режимі: қосу/өзгерту/өшіру батырмалары жоқ. */
export default function TimetableAdmin() {
  useSeo('Әкімші — сабақ кестесі', 'Сабақ кестесін қарау (тек оқу).', '/admin/timetable');
  const [query, setQuery] = useState('');
  const { data, error, loading, reload } = useAsync(api.timetable, []);
  useTimetableRealtime(reload);

  const entries = data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.teacher_name, e.subject_title, e.class_name, e.room, weekdayName(e.weekday)]
        .some((v) => v.toLowerCase().includes(q)));
  }, [entries, query]);

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Сабақ кестесі</h1>
          <p className="muted small">
            Бұл бөлім тек қарауға арналған. Кестені қосу, өзгерту немесе өшіру құқығы тек директорда.
          </p>
        </div>
        <div className="row">
          <span className="badge badge-locked"><Icon name="eye" size={14} /> Тек оқу</span>
          <span className="badge badge-open">{entries.length} сабақ</span>
        </div>
      </div>

      <div className="card pad">
        <div className="toolbar">
          <input className="input search" aria-label="Кестеден іздеу"
            placeholder="Мұғалім, пән, сынып немесе кабинет бойынша іздеу"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="muted small">{filtered.length} / {entries.length} жазба</span>
        </div>
      </div>

      {loading && !data && <Spinner />}
      {error != null && <ErrorState message={friendlyError(error)} onRetry={reload} />}
      {!loading && error == null && (
        <TimetableBoard entries={filtered} emptyText="Директор кестеге сабақ қосқанда осында көрінеді." />
      )}
    </div>
  );
}
