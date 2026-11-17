import { NewsCard } from '../components/NewsCard';
import { Empty, ErrorState, Spinner, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useRealtime } from '../lib/useRealtime';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';

export default function News() {
  const t = useT();
  useSeo(t('nav.news'), '165 MEKTEP мектебінің соңғы жаңалықтары мен хабарландырулары.', '/news');
  const { data, error, loading, reload } = useAsync(() => api.news(), []);

  // Realtime: админ жаңалық қосса/өзгертсе, тізім өздігінен жаңарады
  useRealtime(['news'], reload);

  return (
    <section className="container page">
      <header className="page-head">
        <span className="eyebrow">165 MEKTEP</span>
        <h1>{t('nav.news')}</h1>
        <p className="muted">Мектеп өмірінен соңғы жаңалықтар мен маңызды хабарландырулар.</p>
      </header>
      {loading && !data ? <Spinner />
        : error ? <ErrorState message={friendlyError(error)} onRetry={reload} />
        : !data || data.length === 0 ? <Empty title="Жаңалықтар әзірге жарияланбаған" text="Жақында осында мектептің жаңалықтары пайда болады." />
        : <div className="grid grid-3">{data.map((n) => <NewsCard key={n.id} item={n} />)}</div>}
    </section>
  );
}
