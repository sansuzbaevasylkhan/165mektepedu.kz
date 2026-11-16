import { legal } from '../content/kk';
import { useSeo } from '../lib/seo';

function LegalPage({ doc, path }: { doc: typeof legal.privacy; path: string }) {
  useSeo(doc.title, `${doc.title} — 165 MEKTEP порталы.`, path);
  return (
    <section className="container page narrow">
      <h1>{doc.title}</h1>
      <p className="muted">Соңғы жаңарту: {doc.updated}</p>
      {doc.sections.map((s) => (
        <article key={s.h} className="legal-block">
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </article>
      ))}
    </section>
  );
}

export const Privacy = () => <LegalPage doc={legal.privacy} path="/privacy" />;
export const Terms = () => <LegalPage doc={legal.terms} path="/terms" />;
