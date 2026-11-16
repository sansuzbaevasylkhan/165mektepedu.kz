const ALLOWED = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI',
  'H2', 'H3', 'H4', 'BLOCKQUOTE', 'A', 'IMG', 'CODE', 'PRE', 'HR',
]);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'TEXTAREA', 'LINK', 'META']);
const ATTRS: Record<string, string[]> = {
  A: ['href', 'title'],
  IMG: ['src', 'alt'],
};

export function isHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** Тек рұқсат етілген тег/атрибуттарды қалдырады — жаңалық мазмұны үшін. */
export function sanitizeHtml(dirty: string): string {
  const doc = new DOMParser().parseFromString(dirty, 'text/html');
  const clean = (node: Element) => {
    [...node.children].forEach(clean);
    if (DROP.has(node.tagName)) { node.remove(); return; }
    if (!ALLOWED.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }
    for (const attr of [...node.attributes]) {
      if (!(ATTRS[node.tagName] ?? []).includes(attr.name)) node.removeAttribute(attr.name);
    }
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (!/^(https?:\/\/|mailto:|\/)/i.test(href)) node.removeAttribute('href');
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('target', '_blank');
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? '';
      if (!/^https?:\/\//i.test(src)) node.remove();
    }
  };
  [...doc.body.children].forEach(clean);
  return doc.body.innerHTML;
}
