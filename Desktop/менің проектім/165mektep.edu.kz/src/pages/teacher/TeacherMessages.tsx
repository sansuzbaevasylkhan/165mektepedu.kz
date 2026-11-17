import { useMemo, useState } from 'react';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import type { MessageAudience, TeacherMessage } from '../../types';

type Filter = 'all' | 'inbox' | 'sent' | 'unread';

const AUD_LABEL: Record<MessageAudience, string> = {
  individual: 'Жеке оқушы', class: 'Бүкіл сынып', parents: 'Сынып ата-аналары', director: 'Директорға',
};

const SUBJECT_AUD: Record<string, string> = {
  individual: 'Бір оқушыға жеке хабарлама', class: 'Сыныптың барлық оқушысына',
  parents: 'Сынып ата-аналарына', director: 'Директорға есеп/хабарлама',
};

export default function TeacherMessages() {
  const toast = useToast();
  const data = useAsync(() => api.messages.mine(100), []);
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  useRealtime(['teacher_messages'], data.reload);
  const [filter, setFilter] = useState<Filter>('all');
  const [compose, setCompose] = useState(false);
  const [active, setActive] = useState<TeacherMessage | null>(null);

  const rows = data.data ?? [];
  const counts = useMemo(() => ({
    inbox: rows.filter((m) => !m.is_mine).length,
    sent: rows.filter((m) => m.is_mine).length,
    unread: rows.filter((m) => !m.is_mine && !m.read_at).length,
  }), [rows]);

  const shown = rows.filter((m) => {
    if (filter === 'inbox') return !m.is_mine;
    if (filter === 'sent') return m.is_mine;
    if (filter === 'unread') return !m.is_mine && !m.read_at;
    return true;
  });

  const open = async (m: TeacherMessage) => {
    setActive(m);
    if (!m.is_mine && !m.read_at) {
      try { await api.messages.markRead(m.id); data.reload(); }
      catch { /* read marker is best-effort */ }
    }
  };

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Хабарламалар</h1>
          <p className="muted small">Оқушыларға, ата-аналарға және директорға хабарлама жіберіңіз.</p>
        </div>
        <button className="btn btn-gold" onClick={() => setCompose(true)}>
          <Icon name="plus" size={16} /> Жаңа хабарлама
        </button>
      </div>

      <div className="tch-mini-stats">
        <div className="tch-mini-stat"><b>{counts.unread}</b><span>Оқылмаған</span></div>
        <div className="tch-mini-stat"><b>{counts.inbox}</b><span>Келген</span></div>
        <div className="tch-mini-stat"><b>{counts.sent}</b><span>Жіберілген</span></div>
      </div>

      <div className="tch-tabs tch-tabs-inline" role="tablist" aria-label="Хабарлама сүзгісі">
        {([['all', 'Барлығы'], ['inbox', 'Келген'], ['sent', 'Жіберілген'], ['unread', 'Оқылмаған']] as [Filter, string][])
          .map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k}
              className={`tch-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
      </div>

      {data.loading && !data.data ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : shown.length === 0 ? <Empty title="Хабарлама жоқ" text="Жаңа хабарлама жіберу үшін жоғарыдағы батырманы басыңыз." />
        : (
          <div className="tch-msg-list">
            {shown.map((m) => (
              <button type="button" className={`card pad tch-msg-card ${!m.is_mine && !m.read_at ? 'unread' : ''}`}
                key={m.id} onClick={() => void open(m)}>
                <div className="tch-msg-head">
                  <div>
                    <b>{m.title}</b>
                    <span className="muted small">
                      {m.is_mine ? `→ ${m.recipient_name || 'Алушы'}` : `← ${m.sender_name || 'Жіберуші'}`}
                      {' · '}{AUD_LABEL[m.audience]}{m.class_name ? ` · ${m.class_name}` : ''}
                    </span>
                  </div>
                  <div className="tch-badges">
                    {m.important && <span className="badge adm-badge-warn">Маңызды</span>}
                    {!m.is_mine && !m.read_at && <span className="badge adm-badge-bad">Жаңа</span>}
                    {m.is_mine && (
                      <span className={`badge ${m.read_at ? 'adm-badge-ok' : 'adm-badge-muted'}`}>
                        {m.read_at ? 'Оқылды' : 'Оқылмаған'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="tch-msg-body">{m.body}</p>
                <span className="muted small">{fmtDateTime(m.created_at)}</span>
              </button>
            ))}
          </div>
        )}

      {compose && <ComposeModal subjects={subjects.data ?? []} onClose={() => setCompose(false)}
        onSent={() => { setCompose(false); data.reload(); }} />}

      {active && (
        <Modal title={active.title} onClose={() => setActive(null)}>
          <div className="stack">
            <div className="tch-badges">
              <span className="badge adm-badge-muted">{AUD_LABEL[active.audience]}</span>
              {active.class_name && <span className="badge adm-badge-muted">{active.class_name}</span>}
              {active.important && <span className="badge adm-badge-warn">Маңызды</span>}
            </div>
            <p className="muted small">
              {active.is_mine
                ? `Алушы: ${active.recipient_name} · ${active.read_at ? `оқылды ${fmtDateTime(active.read_at)}` : 'әлі оқылмаған'}`
                : `Жіберуші: ${active.sender_name}`}
              {' · '}{fmtDateTime(active.created_at)}
            </p>
            <p className="tch-pre">{active.body}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ComposeModal({ subjects, onClose, onSent }: {
  subjects: { subject_id: string; subject_title: string; classes: string[] }[];
  onClose: () => void; onSent: () => void;
}) {
  const toast = useToast();
  const [audience, setAudience] = useState<MessageAudience>('class');
  const [klass, setKlass] = useState('');
  const [subject, setSubject] = useState('');
  const [recipient, setRecipient] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);
  const [busy, setBusy] = useState(false);

  const classMap = useMemo(() => {
    const map = new Map<string, { subject: string; title: string }>();
    for (const s of subjects) for (const c of s.classes) if (!map.has(c)) map.set(c, { subject: s.subject_id, title: s.subject_title });
    return map;
  }, [subjects]);

  const roster = useAsync(
    () => (audience === 'individual' && klass && classMap.get(klass)
      ? api.teacher.classStudents(classMap.get(klass)!.subject, klass)
      : Promise.resolve([])),
    [audience, klass, classMap],
  );

  const send = async () => {
    if (!title.trim()) { toast.show('Тақырыпты енгізіңіз', 'error'); return; }
    if (!body.trim()) { toast.show('Хабарлама мәтінін енгізіңіз', 'error'); return; }
    if (audience === 'individual' && !recipient) { toast.show('Оқушыны таңдаңыз', 'error'); return; }
    if ((audience === 'class' || audience === 'parents') && !klass) { toast.show('Сыныпты таңдаңыз', 'error'); return; }
    setBusy(true);
    try {
      const count = await api.messages.send({
        audience, title: title.trim(), body: body.trim(),
        recipient: audience === 'individual' ? recipient : null,
        klass: audience === 'individual' || audience === 'director' ? '' : klass,
        subject: subject || null, important,
      });
      toast.show(count > 0 ? `Хабарлама жіберілді (${count} алушы)` : 'Алушы табылмады', count > 0 ? 'success' : 'error');
      if (count > 0) onSent();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const classes = [...classMap.keys()].sort();

  return (
    <Modal title="Жаңа хабарлама" onClose={onClose}>
      <div className="stack">
        <Field label="Кімге" hint={SUBJECT_AUD[audience]}>
          <select className="input" value={audience}
            onChange={(e) => { setAudience(e.target.value as MessageAudience); setRecipient(''); }}>
            {(Object.keys(AUD_LABEL) as MessageAudience[]).map((a) => <option key={a} value={a}>{AUD_LABEL[a]}</option>)}
          </select>
        </Field>

        {audience !== 'director' && (
          <Field label="Сынып">
            <select className="input" value={klass} onChange={(e) => { setKlass(e.target.value); setRecipient(''); }}>
              <option value="">Таңдаңыз</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        )}

        {audience === 'individual' && (
          <Field label="Оқушы">
            {!klass ? <span className="muted small">Алдымен сыныпты таңдаңыз.</span>
              : roster.loading ? <Spinner />
              : (roster.data?.length ?? 0) === 0 ? <span className="muted small">Оқушы құрамы бос.</span>
              : (
                <select className="input" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                  <option value="">Таңдаңыз</option>
                  {roster.data!.map((s) => <option key={s.student_id} value={s.student_id}>{s.last_name} {s.first_name}</option>)}
                </select>
              )}
          </Field>
        )}

        {(audience === 'class' || audience === 'parents') && klass && (
          <Field label="Пән (міндетті емес)">
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Жалпы</option>
              {subjects.filter((s) => s.classes.includes(klass)).map((s) => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_title}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Тақырып">
          <input className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Мәтін">
          <textarea className="input" rows={5} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
          <span>Маңызды деп белгілеу</span>
        </label>
        <div className="tch-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button className="btn btn-gold" disabled={busy} onClick={() => void send()}>
            <Icon name="mail" size={16} /> Жіберу
          </button>
        </div>
      </div>
    </Modal>
  );
}
