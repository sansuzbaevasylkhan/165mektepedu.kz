import { advantages as defaultAdvantages, directions as defaultDirections } from '../content/kk';

export function parseJson<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as T | null;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export const ADVANTAGE_ICONS = ['cap', 'shield', 'video', 'users', 'trophy', 'star', 'book', 'spark', 'globe', 'check'] as const;

export interface AdvantageItem { icon: string; title: string; text: string }
export interface DirectionItem { title: string; text: string }
export interface DirectionBlock { id: string; tab: string; title: string; text: string; items: DirectionItem[] }

export function parseAdvantages(value: string | undefined): AdvantageItem[] {
  const saved = parseJson<AdvantageItem[]>(value, []);
  const clean = (Array.isArray(saved) ? saved : [])
    .filter((a) => a && typeof a.title === 'string' && a.title.trim())
    .map((a) => ({
      icon: ADVANTAGE_ICONS.includes(a.icon as typeof ADVANTAGE_ICONS[number]) ? a.icon : 'star',
      title: a.title.trim(),
      text: (a.text ?? '').trim(),
    }));
  return clean.length ? clean : defaultAdvantages.map((a) => ({ icon: a.icon, title: a.t, text: a.d }));
}

export function parseDirections(value: string | undefined): DirectionBlock[] {
  const saved = parseJson<DirectionBlock[]>(value, []);
  const clean = (Array.isArray(saved) ? saved : [])
    .filter((d) => d && typeof d.tab === 'string' && d.tab.trim())
    .map((d, i) => ({
      id: (d.id ?? '').trim() || `dir-${i + 1}`,
      tab: d.tab.trim(),
      title: (d.title ?? d.tab).trim(),
      text: (d.text ?? '').trim(),
      items: (Array.isArray(d.items) ? d.items : [])
        .filter((it) => it && typeof it.title === 'string' && it.title.trim())
        .map((it) => ({ title: it.title.trim(), text: (it.text ?? '').trim() })),
    }));
  return clean.length ? clean : defaultDirections.map((d) => ({
    id: d.id, tab: d.tab, title: d.title, text: d.text,
    items: d.items.map((it) => ({ title: it.t, text: it.d })),
  }));
}

export interface HomeContent {
  eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
  primary_text?: string;
  primary_link?: string;
  secondary_text?: string;
  secondary_link?: string;
  about_title?: string;
  about_intro?: string;
}

export interface AboutContent {
  intro?: string;
  history?: string;
  mission?: string;
  goal?: string;
}

export const HOME_SECTIONS = [
  ['about', 'Мектеп туралы қысқаша'],
  ['directions', 'Білім беру бағыттары'],
  ['news', 'Жаңалықтар'],
  ['ubt', 'ҰБТ платформасы'],
  ['achievements', 'Жетістіктер'],
  ['advantages', 'Артықшылықтар'],
  ['social', 'Әлеуметтік желілер және байланыс'],
] as const;

export type HomeSectionId = typeof HOME_SECTIONS[number][0];

export function homeSectionOrder(value: string | undefined): HomeSectionId[] {
  const all = HOME_SECTIONS.map((s) => s[0]);
  const saved = parseJson<HomeSectionId[]>(value, []);
  const order = saved.filter((id, i) => all.includes(id) && saved.indexOf(id) === i);
  return [...order, ...all.filter((id) => !order.includes(id))];
}

export function lines(value: string | undefined, fallback: string[]): string[] {
  const rows = (value ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  return rows.length ? rows : fallback;
}

export function safeHref(value: string | undefined): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (v.startsWith('/')) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return null;
}
