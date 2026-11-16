import { Icon } from './Icons';
import type { TimetableEntry } from '../types';

export const WEEKDAYS = [
  { n: 1, short: 'Дс', full: 'Дүйсенбі' },
  { n: 2, short: 'Сс', full: 'Сейсенбі' },
  { n: 3, short: 'Ср', full: 'Сәрсенбі' },
  { n: 4, short: 'Бс', full: 'Бейсенбі' },
  { n: 5, short: 'Жм', full: 'Жұма' },
  { n: 6, short: 'Сб', full: 'Сенбі' },
  { n: 7, short: 'Жс', full: 'Жексенбі' },
];

export const weekdayName = (n: number) => WEEKDAYS.find((d) => d.n === n)?.full ?? '—';

export function fmtTime(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}

export function sortTimetable(a: TimetableEntry, b: TimetableEntry): number {
  if (a.weekday !== b.weekday) return a.weekday - b.weekday;
  if (a.start_time !== b.start_time) return a.start_time.localeCompare(b.start_time);
  return a.class_name.localeCompare(b.class_name, 'kk');
}

interface TimetableBoardProps {
  entries: TimetableEntry[];
  showTeacher?: boolean;
  manage?: boolean;
  busyId?: string | null;
  onEdit?: (entry: TimetableEntry) => void;
  onDelete?: (entry: TimetableEntry) => void;
  emptyText?: string;
}

/** Апта күндері бойынша топтастырылған кесте. Директорға — өңдеу/өшіру әрекеттерімен, қалғандарына тек оқу. */
export function TimetableBoard({
  entries, showTeacher = true, manage = false, busyId = null, onEdit, onDelete, emptyText,
}: TimetableBoardProps) {
  if (entries.length === 0) {
    return (
      <div className="state empty tt-empty">
        <div className="state-icon"><Icon name="clock" size={28} /></div>
        <h3>Кесте әзірге бос</h3>
        <p>{emptyText ?? 'Сабақ кестесіне жазбалар қосылмаған.'}</p>
      </div>
    );
  }

  return (
    <div className="tt-board">
      {WEEKDAYS.map((day) => {
        const rows = entries.filter((e) => e.weekday === day.n).sort(sortTimetable);
        return (
          <section className="tt-day" key={day.n} aria-labelledby={`tt-day-${day.n}`}>
            <header className="tt-day-head">
              <span className="tt-day-chip">{day.short}</span>
              <h3 id={`tt-day-${day.n}`}>{day.full}</h3>
              <span className="tt-day-count">{rows.length ? `${rows.length} сабақ` : '—'}</span>
            </header>
            {rows.length === 0 ? (
              <p className="tt-free">Сабақ жоқ</p>
            ) : (
              <div className="tt-rows">
                {rows.map((e) => (
                  <article className="tt-row" key={e.id}>
                    <div className="tt-time">
                      <b>{fmtTime(e.start_time)}</b>
                      {e.end_time && <span>{fmtTime(e.end_time)}</span>}
                    </div>
                    <div className="tt-main">
                      <div className="tt-subject">{e.subject_title}</div>
                      <div className="tt-meta">
                        <span className="tt-class">{e.class_name}</span>
                        {showTeacher && <span className="tt-teacher">{e.teacher_name}</span>}
                        {e.room.trim() && (
                          <span className="tt-room"><Icon name="pin" size={13} />{e.room}</span>
                        )}
                      </div>
                    </div>
                    {manage && (
                      <div className="tt-actions">
                        <button type="button" className="icon-btn" title="Өңдеу" aria-label="Өңдеу"
                          onClick={() => onEdit?.(e)}><Icon name="edit" size={18} /></button>
                        <button type="button" className="icon-btn tt-del" title="Өшіру" aria-label="Өшіру"
                          disabled={busyId === e.id} onClick={() => onDelete?.(e)}><Icon name="trash" size={18} /></button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
