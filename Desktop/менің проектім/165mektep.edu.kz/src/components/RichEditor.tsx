import { useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { uploadPublic } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/errors';

const BLOCKS: { label: string; tag: string }[] = [
  { label: 'Мәтін', tag: 'p' },
  { label: 'Тақырып', tag: 'h2' },
  { label: 'Дәйексөз', tag: 'blockquote' },
];

export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };

  const link = () => {
    const url = window.prompt('Сілтеме (https://...)');
    if (!url) return;
    if (!/^https?:\/\//i.test(url.trim())) { toast.show('Сілтеме https:// бастап жазылуы керек', 'error'); return; }
    exec('createLink', url.trim());
  };

  const image = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await uploadPublic('news-images', file);
      exec('insertImage', url);
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  return (
    <div className="rich">
      <div className="rich-toolbar" role="toolbar" aria-label="Мәтін пішімдеу">
        <button type="button" className="rich-btn" title="Қалың" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" className="rich-btn" title="Курсив" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><i>I</i></button>
        <button type="button" className="rich-btn" title="Астын сызу" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><u>U</u></button>
        <span className="rich-sep" />
        <select className="rich-select" aria-label="Абзац түрі" defaultValue="p"
          onChange={(e) => exec('formatBlock', e.target.value)}>
          {BLOCKS.map((b) => <option key={b.tag} value={b.tag}>{b.label}</option>)}
        </select>
        <button type="button" className="rich-btn" title="Тізім" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>•≡</button>
        <button type="button" className="rich-btn" title="Нөмірленген тізім" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}>1≡</button>
        <span className="rich-sep" />
        <button type="button" className="rich-btn" title="Сілтеме" onMouseDown={(e) => e.preventDefault()} onClick={link}><Icon name="link" size={16} /></button>
        <button type="button" className="rich-btn" title="Сурет" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}><Icon name="image" size={16} /></button>
        <span className="rich-sep" />
        <button type="button" className="rich-btn" title="Болдырмау" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('undo')}>↺</button>
        <button type="button" className="rich-btn" title="Қайталау" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('redo')}>↻</button>
      </div>
      <div ref={ref} className="rich-area" contentEditable suppressContentEditableWarning
        role="textbox" aria-multiline="true"
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)} />
      <input ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { void image(e.target.files?.[0] ?? null); e.target.value = ''; }} />
    </div>
  );
}
