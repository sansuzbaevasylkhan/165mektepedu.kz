import type { LessonStatus } from '../types';

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('kk-KZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Бір сабақтың орындалу пайызы (видео + тест). */
export function lessonPercent(l: LessonStatus): number {
  if (l.completed) return 100;
  if (!l.has_test) return l.video_percent;
  return Math.round(l.video_percent * 0.5 + (l.test_passed ? 50 : 0));
}

export function overallPercent(lessons: LessonStatus[]): number {
  if (!lessons.length) return 0;
  return Math.round(lessons.reduce((a, l) => a + lessonPercent(l), 0) / lessons.length);
}

export function safeFileName(name: string): string {
  return name.normalize('NFKD').replace(/[^\w.\-]+/g, '_').slice(-80);
}

export function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function isHttpUrl(v: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(v);
}

export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    const u = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(u);
      resolve(Math.round(v.duration));
    };
    v.onerror = () => {
      URL.revokeObjectURL(u);
      reject(new Error('metadata'));
    };
    v.src = u;
  });
}
