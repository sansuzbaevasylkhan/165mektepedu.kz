import type { ReactNode } from 'react';
import { Icon } from '../Icons';
import { EMPLOYMENT_CLASS, EMPLOYMENT_LABEL, parseClasses, teacherInitials } from '../../lib/teacher';
import type { Subject, TeacherAssignment, TeacherEmploymentStatus } from '../../types';

export function TeacherAvatar({ t, size = 44 }: {
  t: { photo_url?: string | null; first_name: string; last_name: string };
  size?: number;
}) {
  return t.photo_url
    ? <img className="tch-avatar" src={t.photo_url} alt="" style={{ width: size, height: size }} />
    : <span className="tch-avatar tch-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.36 }}>{teacherInitials(t)}</span>;
}

export function EmploymentBadge({ status }: { status: TeacherEmploymentStatus }) {
  return <span className={`badge ${EMPLOYMENT_CLASS[status]}`}>{EMPLOYMENT_LABEL[status]}</span>;
}

export function BlockBadge({ blocked, until }: { blocked: boolean; until?: string | null }) {
  if (!blocked) return null;
  return (
    <span className="badge adm-badge-bad" title={until ? `Бұғаттау мерзімі: ${until.slice(0, 10)}` : undefined}>
      Бұғатталған
    </span>
  );
}

export function NoPermission({ children }: { children: ReactNode }) {
  return (
    <div className="tch-note">
      <Icon name="lock" size={16} />
      <span>{children}</span>
    </div>
  );
}

export function SectionCard({ title, action, children, className = '' }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`card pad tch-section ${className}`}>
      <div className="section-row">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export interface AssignmentDraft {
  subject_id: string;
  classesText: string;
  weekly_hours: number;
}

export const toDrafts = (items: TeacherAssignment[]): AssignmentDraft[] =>
  items.map((a) => ({ subject_id: a.subject_id, classesText: a.classes.join(', '), weekly_hours: a.weekly_hours }));

export const fromDrafts = (items: AssignmentDraft[]) =>
  items
    .filter((a) => a.subject_id)
    .map((a) => ({
      subject_id: a.subject_id,
      classes: parseClasses(a.classesText),
      weekly_hours: Math.max(0, Math.min(40, Number(a.weekly_hours) || 0)),
    }));

export function AssignmentEditor({ value, subjects, onChange, disabled }: {
  value: AssignmentDraft[];
  subjects: Subject[];
  onChange: (v: AssignmentDraft[]) => void;
  disabled?: boolean;
}) {
  const update = (i: number, patch: Partial<AssignmentDraft>) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <div className="tch-assign-editor">
      {value.length === 0 && <p className="muted small">Пән қосылмаған. «Пән қосу» түймесін басыңыз.</p>}
      {value.map((row, i) => (
        <div className="tch-assign-row" key={i}>
          <label className="field">
            <span className="field-label">Пән</span>
            <select className="input" value={row.subject_id} disabled={disabled}
              onChange={(e) => update(i, { subject_id: e.target.value })}>
              <option value="">— таңдау —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Сыныптар</span>
            <input className="input" placeholder="5А, 6Б, 9Ә" value={row.classesText} disabled={disabled}
              onChange={(e) => update(i, { classesText: e.target.value })} />
          </label>
          <label className="field tch-hours-field">
            <span className="field-label">Апталық сағат</span>
            <input className="input" type="number" min={0} max={40} value={row.weekly_hours} disabled={disabled}
              onChange={(e) => update(i, { weekly_hours: Number(e.target.value) })} />
          </label>
          <button type="button" className="icon-btn tch-remove" aria-label="Жолды өшіру" disabled={disabled}
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
            <Icon name="trash" size={17} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" disabled={disabled}
        onClick={() => onChange([...value, { subject_id: '', classesText: '', weekly_hours: 0 }])}>
        <Icon name="plus" size={16} /> Пән қосу
      </button>
    </div>
  );
}
