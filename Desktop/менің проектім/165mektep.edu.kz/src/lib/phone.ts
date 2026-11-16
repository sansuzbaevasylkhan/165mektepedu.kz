/** Телефон: ішкі күйде тек 10 ұлттық цифр сақталады ("+7" әрқашан префикс). */
export function normalizeDigits(raw: string): string {
  const hasPrefix = raw.trim().startsWith('+7');
  let d = raw.replace(/\D/g, '');
  if (hasPrefix) d = d.slice(1);
  else if (d.length > 10 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
  return d.slice(0, 10);
}

/** +7 (777)-777-77-77 */
export function formatPhone(d: string): string {
  let p = '+7 (';
  if (d.length > 0) p += d.slice(0, 3);
  if (d.length >= 3) p += ')';
  if (d.length > 3) p += '-' + d.slice(3, 6);
  if (d.length > 6) p += '-' + d.slice(6, 8);
  if (d.length > 8) p += '-' + d.slice(8, 10);
  return p;
}

export const toE164 = (d: string) => `+7${d}`;
export const isValidPhone = (d: string) => /^7\d{9}$/.test(d);
export const prettyFromE164 = (p: string) => formatPhone(p.replace(/^\+7/, ''));
