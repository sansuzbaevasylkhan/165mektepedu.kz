import { useState } from 'react';
import { uploadPublic } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useToast } from '../context/ToastContext';

interface Props {
  bucket: 'news-images' | 'site-media';
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

const MAX_MB = 8;

export function ImageUpload({ bucket, value, onChange, label = 'Сурет жүктеу' }: Props) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.show('Тек сурет файлын таңдаңыз', 'error'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.show(`Сурет ${MAX_MB} МБ-тан аспауы керек`, 'error'); return; }
    setBusy(true);
    try {
      onChange(await uploadPublic(bucket, file));
    } catch (e) {
      toast.show(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {value && <img src={value} alt="" className="upload-preview" />}
      <div className="row">
        <label className="btn btn-ghost btn-sm file-btn">
          {busy ? 'Жүктелуде...' : value ? 'Ауыстыру' : 'Файл таңдау'}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>Өшіру</button>}
      </div>
    </div>
  );
}
