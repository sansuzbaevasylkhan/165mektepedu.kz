import { useState, type FormEvent } from 'react';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import type { ContentItem, ContentKind } from '../../types';

export const KIND_LABEL: Record<ContentKind, string> = {
  teacher: 'Мұғалімдер',
  achievement: 'Мектеп жетістіктері',
  student_achievement: 'Оқушылар жетістіктері',
  gallery: 'Фотогалерея',
};
const NO_IMAGE: ContentKind[] = ['achievement', 'student_achievement'];

type Draft = Partial<ContentItem> & { title: string; subtitle: string; image_url: string | null; sort_order: number };

export function ContentManager({ kinds, title = 'Мазмұн' }: { kinds: ContentKind[]; title?: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState<ContentKind>(kinds[0]);
  const list = useAsync(() => api.content(kind), [kind]);
  useRealtime(['content_items'], list.reload);
  const [draft, setDraft] = useState<Draft | null>(null);
  const isGallery = kind === 'gallery';

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!isGallery && !draft.title.trim()) { toast.show('Атауын енгізіңіз', 'error'); return; }
    if (isGallery && !draft.image_url) { toast.show('Сурет жүктеңіз', 'error'); return; }
    const payload = {
      kind, title: draft.title.trim(), subtitle: draft.subtitle.trim(),
      image_url: draft.image_url, sort_order: Number(draft.sort_order) || 0,
    };
    const { error } = draft.id
      ? await supabase.from('content_items').update(payload).eq('id', draft.id)
      : await supabase.from('content_items').insert(payload);
    if (error) { toast.show(friendlyError(error), 'error'); return; }
    toast.show('Сақталды', 'success'); setDraft(null); list.reload();
  };

  const remove = async (x: ContentItem) => {
    if (!confirm()) return;
    const { error } = await supabase.from('content_items').delete().eq('id', x.id);
    if (error) toast.show(friendlyError(error), 'error'); else { toast.show('Өшірілді', 'success'); list.reload(); }
  };

  return (
    <div className="card pad stack-lg">
      <div className="section-row">
        <h2>{title}</h2>
        <button className="btn btn-gold btn-sm"
          onClick={() => setDraft({ title: '', subtitle: '', image_url: null, sort_order: (list.data?.length ?? 0) + 1 })}>
          Қосу
        </button>
      </div>
      {kinds.length > 1 && (
        <div className="tabs small">
          {kinds.map((k) => (
            <button key={k} className={`tab ${kind === k ? 'active' : ''}`} onClick={() => setKind(k)}>{KIND_LABEL[k]}</button>
          ))}
        </div>
      )}
      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : !list.data?.length ? <Empty title="Әзірге бос" text="Осы бөлімге бірінші жазбаны қосыңыз." />
        : (
          <div className="lines">
            {list.data.map((x) => (
              <div key={x.id} className="line">
                <div className="row">
                  {x.image_url && <img src={x.image_url} alt="" className="thumb" />}
                  <div><b>{x.title || '(атаусыз)'}</b>{x.subtitle && <span className="muted small"> · {x.subtitle}</span>}</div>
                </div>
                <div className="row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setDraft({ ...x })}>Өзгерту</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(x)}>Өшіру</button>
                </div>
              </div>
            ))}
          </div>)}

      {draft && (
        <Modal title={`${KIND_LABEL[kind]}: ${draft.id ? 'өзгерту' : 'қосу'}`} onClose={() => setDraft(null)}>
          <form className="form" onSubmit={save} noValidate>
            <Field label={kind === 'teacher' ? 'Аты-жөні' : 'Атауы'}>
              <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={kind === 'teacher' ? 'Пәні / лауазымы' : 'Сипаттамасы'}>
              <input className="input" value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
            </Field>
            {!NO_IMAGE.includes(kind) && (
              <ImageUpload bucket="site-media" value={draft.image_url} onChange={(u) => setDraft({ ...draft, image_url: u })} />
            )}
            <Field label="Реті"><input className="input" type="number" value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
            <div className="row end">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Бас тарту</button>
              <button className="btn btn-gold">Сақтау</button>
            </div>
          </form>
        </Modal>)}
    </div>
  );
}
