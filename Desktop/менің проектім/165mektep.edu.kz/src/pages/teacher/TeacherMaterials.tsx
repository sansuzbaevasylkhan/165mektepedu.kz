import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Empty, ErrorState, Field, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { fileSize } from '../../lib/assignments';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import { useSeo } from '../../lib/seo';
import type { MySubject } from '../../types';

const MAX_BYTES = 20 * 1024 * 1024;

export default function TeacherMaterials() {
  useSeo('Оқу материалдары', undefined, '/teacher/materials');
  const toast = useToast();
  const confirm = useConfirm();
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  const [subjectId, setSubjectId] = useState('');
  const [klass, setKlass] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = subjects.data ?? [];
  const subject: MySubject | undefined = list.find((s) => s.subject_id === subjectId) ?? list[0];

  useEffect(() => {
    if (!subjectId && list.length > 0) setSubjectId(list[0].subject_id);
  }, [list, subjectId]);
  useEffect(() => {
    if (subject && !subject.classes.includes(klass)) setKlass(subject.classes[0] ?? '');
  }, [subject, klass]);

  const materials = useAsync(
    () => (klass ? api.materials.list(klass) : Promise.resolve([])),
    [klass],
  );
  useRealtime(['study_materials'], materials.reload);

  const rows = (materials.data ?? []).filter((m) => !subject || m.subject_id === subject.subject_id);

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) { toast.show('Файл өлшемі 20 МБ-тан аспауы керек', 'error'); return; }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const upload = async () => {
    if (!subject || !klass) { toast.show('Пән мен сыныпты таңдаңыз', 'error'); return; }
    if (!file) { toast.show('Файл таңдаңыз', 'error'); return; }
    if (!title.trim()) { toast.show('Атауын жазыңыз', 'error'); return; }
    setBusy(true);
    try {
      const path = await api.materials.upload(subject.subject_id, file);
      await api.materials.save({
        subject_id: subject.subject_id, class_name: klass,
        title: title.trim(), description: description.trim(),
        file_name: file.name, storage_path: path,
        mime_type: file.type || null, size_bytes: file.size,
      });
      toast.show('Материал қосылды', 'success');
      setFile(null); setTitle(''); setDescription('');
      materials.reload();
    } catch (e) {
      toast.show(friendlyError(e), 'error');
    } finally { setBusy(false); }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`«${name}» материалы жойылады. Жалғастыру?`)) return;
    try { await api.materials.remove(id); toast.show('Жойылды', 'success'); materials.reload(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  const open = async (path: string) => {
    try { window.open(await api.materials.signedUrl(path), '_blank', 'noopener'); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Оқу процесі</span>
          <h1>Оқу материалдары</h1>
          <p className="muted small">Конспект, презентация, бейне және қосымша файлдарды сыныпқа жүктеңіз. Файлдар жабық қоймада (private) сақталады.</p>
        </div>
      </div>

      {subjects.loading && !subjects.data ? <Spinner />
        : subjects.error ? <ErrorState message={friendlyError(subjects.error)} onRetry={subjects.reload} />
        : list.length === 0 ? <Empty title="Пән бекітілмеген" text="Әкімшілік пән бекіткен соң материал жүктей аласыз." />
        : (
          <>
            <div className="card pad stack">
              <div className="tch-form-grid">
                <Field label="Пән">
                  <select className="input" value={subject?.subject_id ?? ''} onChange={(e) => setSubjectId(e.target.value)}>
                    {list.map((s) => <option key={s.id} value={s.subject_id}>{s.subject_title}</option>)}
                  </select>
                </Field>
                <Field label="Сынып">
                  <select className="input" value={klass} onChange={(e) => setKlass(e.target.value)}>
                    {(subject?.classes ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Файл" hint="20 МБ дейін · pdf, docx, pptx, сурет, видео">
                  <input ref={fileRef} type="file" hidden onChange={pick} />
                  <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
                    <Icon name="file" size={15} /> {file ? file.name : 'Файл таңдау'}
                  </button>
                </Field>
              </div>
              <Field label="Атауы">
                <input className="input" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Сипаттама" hint="Міндетті емес">
                <textarea className="input" rows={2} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <div className="row">
                <button className="btn btn-gold" disabled={busy || !file} onClick={() => void upload()}>
                  <Icon name="plus" size={15} /> {busy ? 'Жүктелуде…' : 'Материал қосу'}
                </button>
              </div>
            </div>

            <section className="stack">
              <div className="section-row">
                <h2 className="section-title left">{subject?.subject_title ?? 'Материалдар'} — {klass}</h2>
                <span className="badge adm-badge-muted">{rows.length}</span>
              </div>
              {materials.loading && !materials.data ? <Spinner />
                : materials.error ? <ErrorState message={friendlyError(materials.error)} onRetry={materials.reload} />
                : rows.length === 0 ? <Empty title="Материал жоқ" text="Жоғарыдағы форма арқылы бірінші материалды жүктеңіз." />
                : (
                  <div className="lines">
                    {rows.map((m) => (
                      <div className="line" key={m.id}>
                        <div>
                          <b>{m.title}</b>
                          <span className="muted small">
                            {' '}· {m.file_name} · {fileSize(m.size_bytes ?? 0)} · {m.class_name} · {fmtDateTime(m.created_at)}
                          </span>
                          {m.description && <p className="muted small">{m.description}</p>}
                        </div>
                        <div className="row">
                          <button className="btn btn-ghost btn-sm" onClick={() => void open(m.storage_path)}>
                            <Icon name="eye" size={14} /> Ашу
                          </button>
                          <button className="icon-btn tch-remove" aria-label="Жою" onClick={() => void remove(m.id, m.title)}>
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </section>
          </>
        )}
    </div>
  );
}
