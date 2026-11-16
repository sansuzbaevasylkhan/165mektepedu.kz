import { kk, type Key } from './kk';

const LANGS: Record<string, Record<Key, string>> = { kk };
let current = 'kk';

export const setLang = (l: string) => {
  if (LANGS[l]) current = l;
};
export const t = (k: Key): string => LANGS[current][k] ?? kk[k];
