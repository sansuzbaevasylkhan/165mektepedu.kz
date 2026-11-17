import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { TeacherAvatar } from '../../components/teacher/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import {
  TASK_PRIORITY_LABEL, TASK_STATUS_CLASS, TASK_STATUS_LABEL, teacherName,
} from '../../lib/teacher';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import type { TeacherTaskStatus } from '../../types';

export default function TasksAdmin() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [teacher, setTeacher] = useState('');
  const teachers = useAsync(() => api.teacher.list({}), []);
  const tasks = useAsync(() => api.teacher.tasks(status, teacher || null), [status, teacher]);
  useRealtime(['teacher_tasks', 'profiles'], () => { tasks.reload(); teachers.reload(); });

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tId, setTId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [due, setDue] = useState('');

  const list = tasks.data ?? [];

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tId) { toast.show('Мұғалімді таңдаңыз', 'error'); return; }
    setBusy(true);
    try {
      await api.teacher.createTask({
        teacher: tId, title, description, priority,
        due: due ? new Date(due).toISOString() : null,
      });
      toast.show('Тапсырма берілді, мұғалімге хабарлама жіберілді', 'success');
      setOpen(false); setTId(''); setTitle(''); setDescription(''); setDue('');
      tasks.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const change = async (task: string, next: TeacherTaskStatus) => {
    try {
      await api.teacher.setTaskStatus(task, next);
      toast.show('Мәртебе жаңартылды', 'success');
      tasks.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const counts = {
    pending: list.filter((t) => t.status === 'pending').length,
    in_progress: list.filter((t) => t.status === 'in_progress').length,
    done: list.filter((t) => t.status === 'done').length,
    overdue: list.filter((t) => t.overdue).length,
  };

  return (
    <div className="stack-lg tch-page">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">ADMIN · Тапсырмалар</span>
          <h1>Мұғалім тапсырмалары</h1>
          <p className="muted small">Тапсырма берілгенде мұғалімге жүйелік хабарлама және браузер push хабарламасы келеді.</p>
        </div>
        <button className="btn btn-gold" onClick={() => setOpen(true)}>
          <Icon name="plus" size={17} /> Тапсырма беру
        </button>
      </div>

      <div className="tch-mini-stats">
        <div className="tch-mini-stat accent"><b>{counts.pending}</b><span>Күтуде</span></div>
        <div className="tch-mini-stat"><b>{counts.in_progress}</b><span>Орындалуда</span></div>
        <div className="tch-mini-stat"><b>{counts.done}</b><span>Орындалды</span></div>
        <div className="tch-mini-stat"><b>{counts.overdue}</b><span>Мерзімі өткен</span></div>
      </div>

      <div className="card pad tch-filters">
        <div className="tch-filter-grid">
          <label className="field">
            <span className="field-label">Мұғалім</span>
            <select className="input" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">Барлық мұғалім</option>
              {(teachers.data ?? []).map((t) => <option key={t.id} value={t.id}>{teacherName(t)}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Мәртебе</span>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Барлық мәртебе</option>
              {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {(teacher || status) && (
            <button type="button" className="btn btn-ghost btn-sm tch-reset"
              onClick={() => { setTeacher(''); setStatus(''); }}>
              <Icon name="close" size={15} /> Тазалау
            </button>
          )}
        </div>
      </div>

      {tasks.loading && !tasks.data ? <Spinner />
        : tasks.error ? <ErrorState message={friendlyError(tasks.error)} onRetry={tasks.reload} />
        : list.length === 0 ? <Empty title="Тапсырма жоқ" text="«Тапсырма беру» арқылы мұғалімге тапсырма жіберіңіз." />
        : (
          <div className="tch-task-list">
            {list.map((t) => (
              <div className={`tch-task ${t.overdue ? 'overdue' : ''}`} key={t.id}>
                <div className="tch-task-head">
                  <div className="tch-task-title">
                    <Link to={`/admin/teachers/${t.teacher_id}?tab=tasks`} className="tch-task-teacher">
                      <TeacherAvatar t={{ first_name: (t.teacher_name ?? '').split(' ')[1] ?? '', last_name: (t.teacher_name ?? '').split(' ')[0] ?? '', photo_url: null }} size={30} />
                      <span>{t.teacher_name}</span>
                    </Link>
                    <b>{t.title}</b>
                  </div>
                  <div className="tch-badges">
                    <span className={`badge ${TASK_STATUS_CLASS[t.status]}`}>{TASK_STATUS_LABEL[t.status]}</span>
                    <span className={`badge ${t.priority === 'urgent' || t.priority === 'high' ? 'adm-badge-bad' : 'adm-badge-muted'}`}>
                      {TASK_PRIORITY_LABEL[t.priority]}
                    </span>
                    {t.overdue && <span className="badge adm-badge-warn">Мерзімі өткен</span>}
                  </div>
                </div>
                {t.description && <p>{t.description}</p>}
                <div className="tch-task-meta muted small">
                  <span><Icon name="clock" size={14} /> {t.due_at ? fmtDateTime(t.due_at) : 'мерзімсіз'}</span>
                  <span>Берген: {t.created_by_name || '—'}</span>
                  <span>Құрылған: {fmtDateTime(t.created_at)}</span>
                </div>
                <div className="tch-task-actions">
                  <select className="input tch-status-select" value={t.status}
                    onChange={(e) => void change(t.id, e.target.value as TeacherTaskStatus)}>
                    {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

      {open && (
        <Modal title="Жаңа тапсырма беру" onClose={() => setOpen(false)}>
          <form className="stack-lg" onSubmit={(e) => void create(e)}>
            <Field label="Мұғалім">
              <select className="input" value={tId} onChange={(e) => setTId(e.target.value)} required>
                <option value="">— таңдау —</option>
                {(teachers.data ?? []).map((t) => <option key={t.id} value={t.id}>{teacherName(t)} · {t.phone}</option>)}
              </select>
            </Field>
            <Field label="Тақырып">
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            </Field>
            <Field label="Сипаттама">
              <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
            </Field>
            <div className="tch-form-grid">
              <Field label="Басымдық">
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {Object.entries(TASK_PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Мерзімі">
                <input className="input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
              </Field>
            </div>
            <div className="tch-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Бас тарту</button>
              <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? 'Жіберілуде…' : 'Тапсырма беру'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
