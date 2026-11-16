import { useState, type FormEvent } from 'react';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { RichEditor } from '../../components/RichEditor';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { fmtDate } from '../../lib/util';
import { sanitizeHtml } from '../../lib/sanitize';
import type { NewsItem } from '../../types';

interface Draft { id?: string; title: string; excerpt: string; content: string; image_url: string | null; published: boolean }
const EMPTY: Draft = { title: '', excerpt: '', content: '', image_url: null, published: false };

export default function NewsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useAsync(async () => {
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NewsItem[];
  }, []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) { toast.show('Тақырыпты енгізіңіз', 'error'); return; }
    setBusy(true);
    const payload = {
      title: draft.title.trim(), excerpt: draft.excerpt.trim(), content: sanitizeHtml(draft.content),
      image_url: draft.image_url, published: draft.published,
    };
    const { error } = draft.id
      ? await supabase.from('news').update(payload).eq('id', draft.id)
      : await supabase.from('news').insert(payload);
    setBusy(false);
    if (error) { toast.show(friendlyError(error), 'error'); return; }
    toast.show('Сақталды', 'success');
    setDraft(null);
    list.reload();
  };

  const togglePublish = async (n: NewsItem) => {
    const { error } = await supabase.from('news').update({ published: !n.published }).eq('id', n.id);
    if (error) toast.show(friendlyError(error), 'error'); else list.reload();
  };

  const remove = async (n: NewsItem) => {
    if (!confirm()) return;
    const { error } = await supabase.from('news').delete().eq('id', n.id);
    if (error) toast.show(friendlyError(error), 'error'); else { toast.show('Өшірілді', 'success'); list.reload(); }
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h1>Жаңалықтар</h1>
        <button className="btn btn-gold" onClick={() => setDraft({ ...EMPTY })}>Жаңалық қосу</button>
      </div>

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : !list.data?.length ? <Empty title="Жаңалықтар жоқ" text="Алғашқы жаңалықты қосыңыз." />
        : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>Тақырып</th><th>Күйі</th><th>Күні</th><th /></tr></thead>
              <tbody>
                {list.data.map((n) => (
                  <tr key={n.id}>
                    <td><b>{n.title}</b></td>
                    <td><span className={`badge ${n.published ? 'badge-done' : 'badge-locked'}`}>{n.published ? 'Жарияланған' : 'Жоба'}</span></td>
                    <td className="muted">{fmtDate(n.published_at ?? n.created_at)}</td>
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(n)}>{n.published ? 'Жарияланымнан алу' : 'Жариялау'}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDraft({ id: n.id, title: n.title, excerpt: n.excerpt, content: n.content, image_url: n.image_url, published: n.published })}>Өзгерту</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(n)}>Өшіру</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {draft && (
        <Modal title={draft.id ? 'Жаңалықты өзгерту' : 'Жаңа жаңалық'} onClose={() => setDraft(null)} wide>
          <form onSubmit={save} className="form" noValidate>
            <Field label="Тақырып">
              <input className="input" value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Қысқаша сипаттама (карточкада көрінеді)">
              <textarea className="input" rows={2} value={draft.excerpt} maxLength={300} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
            </Field>
            <Field label="Толық мәтін">
              <RichEditor value={draft.content} onChange={(html) => setDraft({ ...draft, content: html })} />
            </Field>
            <ImageUpload bucket="news-images" value={draft.image_url} onChange={(u) => setDraft({ ...draft, image_url: u })} />
            <label className="check">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              <span>Жариялау</span>
            </label>
            <div className="row end">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Бас тарту</button>
              <button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
