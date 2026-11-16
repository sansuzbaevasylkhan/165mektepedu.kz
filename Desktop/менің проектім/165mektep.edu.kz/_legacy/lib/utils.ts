import { useEffect } from 'react';

export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title === '165 MEKTEP' ? '165 MEKTEP — Білім — болашаққа бастар жол' : `${title} | 165 MEKTEP`;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
      }
      m.setAttribute('content', description);
    }
  }, [title, description]);
}

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('kk-KZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('kk-KZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
