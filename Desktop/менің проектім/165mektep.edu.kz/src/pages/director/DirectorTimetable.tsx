import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Field, ErrorState, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { TimetableBoard, fmtTime, weekdayName } from '../../components/TimetableBoard';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { useSeo } from '../../lib/seo';
import { useTimetableRealtime } from '../../lib/useTimetableRealtime';
import type { TimetableEntry } from '../../types';

interface Draft {
  teacher_id: string;
  subject_id: string;
  class_name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room: string;
}

const EMPTY: Draft = {
  teacher_id: '', subject_id: '', class_name: '', weekday: 1,
  start_time: '08:00', end_time: '08:45', room: '',
};

function timetableError(err: unknown): string {
  const e = err as { code?: string; message?: string; details?: string };
  const m = `${e?.message ?? ''} ${e?.details ?? ''}`;
  if (e?.code === '23505' && /teacher_slot/.test(m)) return 'Бұл мұғалімде осы күні мен уақытта сабақ бар.';
  if (e?.code === '23505' && /class_slot/.test(m)) return 'Бұл сыныпта осы күні мен уақытта сабақ бар.';
  if (e?.code === '23514') return 'Уақыт қате: аяқталу уақыты басталудан кейін болуы керек.';
  if (e?.code === '42501') return 'Бұл әрекетке рұқсатыңыз жоқ.';
  return friendlyError(err);
}

export default function DirectorTimetable() {
  useSeo('Директор — сабақ кестесі', 'Директор панелінде сабақ кестесін басқару.', '/direktor-admin');
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useAsync(api.timetable, []);
  const catalog = useAsync(api.timetableCatalog, []);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useTimetableRealtime(reload);

  const entries = data ?? [];
  const teachers = catalog.data?.teachers ?? [];
  const subjects = catalog.data?.subjects ?? [];
  const classes = useMemo(
    () => Array.from(new Set(entries.map((e) => e.class_name))).sort((a, b) => a.localeCompare(b, 'kk')),
    [entries],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.teacher_name, e.subject_title, e.class_name, e.room, weekdayName(e.weekday)]
        .some((v) => v.toLowerCase().includes(q)));
  }, [entries, query]);

  useEffect(() => {
    if (catalog.error) toast.show(friendlyError(catalog.error), 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.error]);

  const openNew = () => {
    setDraft({ ...EMPTY, teacher_id: teachers[0]?.id ?? '', subject_id: subjects[0]?.id ?? '' });
    setEditingId(null);
    setFormError(null);
  };

  const openEdit = (e: TimetableEntry) => {
    setDraft({
      teacher_id: e.teacher_id,
      subject_id: e.subject_id,
      class_name: e.class_name,
      weekday: e.weekday,
      start_time: fmtTime(e.start_time),
      end_time: fmtTime(e.end_time),
      room: e.room,
    });
    setEditingId(e.id);
    setFormError(null);
  };

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!draft) return;
    const className = draft.class_name.trim();
    if (!draft.teacher_id) { setFormError('Мұғалімді таңдаңыз.'); return; }
    if (!draft.subject_id) { setFormError('Пәнді таңдаңыз.'); return; }
    if (!className) { setFormError('Сыныпты енгізіңіз.'); return; }
    if (className.length > 20) { setFormError('Сынып атауы 20 таңбадан аспауы керек.'); return; }
    if (!draft.start_time) { setFormError('Басталу уақытын енгізіңіз.'); return; }
    if (draft.end_time && draft.end_time <= draft.start_time) {
      setFormError('Аяқталу уақыты басталудан кейін болуы керек.'); return;
    }
    const payload = {
      teacher_id: draft.teacher_id,
      subject_id: draft.subject_id,
      class_name: className,
      weekday: draft.weekday,
      start_time: fmtTime(draft.start_time),
      end_time: draft.end_time ? fmtTime(draft.end_time) : null,
      room: draft.room.trim(),
    };
    setBusy(true);
    setFormError(null);
    try {
      const res = editingId
        ? await supabase.from('timetable').update(payload).eq('id', editingId)
        : await supabase.from('timetable').insert(payload);
      if (res.error) throw res.error;
      toast.show(editingId ? 'Сабақ жаңартылды' : 'Сабақ кестеге қосылды', 'success');
      setDraft(null);
      setEditingId(null);
      reload();
    } catch (err) {
      setFormError(timetableError(err));
    } finally { setBusy(false); }
  };

  const remove = async (e: TimetableEntry) => {
    if (!confirm(`${weekdayName(e.weekday)} ${fmtTime(e.start_time)} — ${e.class_name}, ${e.subject_title} жазбасын өшіру керек пе?`)) return;
    setBusyId(e.id);
    try {
      const { error: delError } = await supabase.from('timetable').delete().eq('id', e.id);
      if (delError) throw delError;
      toast.show('Жазба өшірілді', 'success');
      reload();
    } catch (err) {
      toast.show(timetableError(err), 'error');
    } finally { setBusyId(null); }
  };

  const noTeachers = !catalog.loading && catalog.error == null && teachers.length === 0;
  const catalogUnavailable = catalog.loading || catalog.error != null;

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Сабақ кестесі</h1>
          <p className="muted small">
            Қосу, өзгерту және өшіру құқығы тек директорда. Барлық өзгерістер серверде тексеріліп, тарихқа жазылады.
          </p>
        </div>
        <div className="row">
          <span className="badge badge-open">{entries.length} сабақ</span>
          <button type="button" className="btn btn-gold" onClick={openNew} disabled={noTeachers || catalogUnavailable}>
            <Icon name="plus" size={18} /> Сабақ қосу
          </button>
        </div>
      </div>

      {noTeachers && (
        <div className="alert alert-error" role="alert">
          Мұғалім рөліндегі аккаунт табылмады. Алдымен мұғалім аккаунтын жасап, рөлін <code>teacher</code> етіп
          беріңіз — содан кейін кестеге сабақ қосуға болады.
        </div>
      )}

      {catalog.error != null && (
        <div className="alert alert-error" role="alert">
          Мұғалімдер мен пәндер тізімін жүктеу мүмкін болмады: {friendlyError(catalog.error)}
        </div>
      )}

      <div className="card pad">
        <div className="toolbar">
          <input className="input search" aria-label="Кестеден іздеу"
            placeholder="Мұғалім, пән, сынып немесе кабинет бойынша іздеу"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="muted small">
            {filtered.length} / {entries.length} жазба
          </span>
        </div>
      </div>

      {(loading || catalog.loading) && <Spinner />}
      {error != null && <ErrorState message={timetableError(error)} onRetry={reload} />}

      {!loading && error == null && (
        <TimetableBoard
          entries={filtered}
          manage
          busyId={busyId}
          onEdit={openEdit}
          onDelete={(e) => void remove(e)}
          emptyText="Кестеге бірінші сабақты қосыңыз. Әр өзгеріс автоматты түрде мұғалімдерге бірден көрінеді."
        />
      )}

      {draft && (
        <Modal title={editingId ? 'Сабақты өзгерту' : 'Жаңа сабақ қосу'} onClose={() => { setDraft(null); setEditingId(null); }} wide>
          <form className="form" onSubmit={save} noValidate>
            <div className="grid grid-2 tight">
              <Field label="Мұғалім">
                <select className="input" value={draft.teacher_id} required
                  onChange={(e) => setDraft({ ...draft, teacher_id: e.target.value })}>
                  <option value="">— таңдаңыз —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Пән">
                <select className="input" value={draft.subject_id} required
                  onChange={(e) => setDraft({ ...draft, subject_id: e.target.value })}>
                  <option value="">— таңдаңыз —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </Field>
              <Field label="Сынып" hint="Мысалы: 10Ә. Бос орынсыз жазыңыз.">
                <input className="input" list="tt-class-list" value={draft.class_name} maxLength={20} required
                  onChange={(e) => setDraft({ ...draft, class_name: e.target.value })} />
                <datalist id="tt-class-list">
                  {classes.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Апта күні">
                <select className="input" value={draft.weekday}
                  onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{weekdayName(n)}</option>)}
                </select>
              </Field>
              <Field label="Басталуы">
                <input className="input" type="time" value={draft.start_time} required
                  onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} />
              </Field>
              <Field label="Аяқталуы" hint="Міндетті емес.">
                <input className="input" type="time" value={draft.end_time}
                  onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} />
              </Field>
              <Field label="Кабинет" hint="Міндетті емес, мысалы 204.">
                <input className="input" value={draft.room} maxLength={40}
                  onChange={(e) => setDraft({ ...draft, room: e.target.value })} />
              </Field>
            </div>
            <p className="muted xs">
              Бір мұғалімде және бір сыныпта бір уақытта екі сабақ болмауы серверде тексеріледі.
            </p>
            {formError && <div className="alert alert-error" role="alert">{formError}</div>}
            <div className="row end">
              <button type="button" className="btn btn-ghost" onClick={() => { setDraft(null); setEditingId(null); }}
                disabled={busy}>Болдырмау</button>
              <button className="btn btn-gold" disabled={busy}>
                {busy ? 'Сақталуда...' : editingId ? 'Өзгерістерді сақтау' : 'Қосу'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
