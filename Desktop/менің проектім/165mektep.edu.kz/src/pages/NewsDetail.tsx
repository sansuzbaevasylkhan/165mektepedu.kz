import { Link, useParams } from 'react-router-dom';
import { Empty, ErrorState, Spinner, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { fmtDate } from '../lib/util';
import { useSeo } from '../lib/seo';
import { Icon } from '../components/Icons';
import { isHtml, sanitizeHtml } from '../lib/sanitize';

export default function NewsDetail() {
  const { id = '' } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.newsItem(id), [id]);
  useSeo(data?.title ?? 'Жаңалық', data?.excerpt || undefined, `/news/${id}`);

  if (loading) return <Spinner />;
  if (error) return <section className="container page"><ErrorState message={friendlyError(error)} onRetry={reload} /></section>;
  if (!data) return <section className="container page"><Empty title="Жаңалық табылмады" text="Ол жарияланымнан алынған немесе өшірілген болуы мүмкін." action={<Link className="btn btn-gold" to="/news">Барлық жаңалықтар</Link>} /></section>;

  return (
    <article className="container page narrow">
      <Link to="/news" className="back-link"><Icon name="arrow" size={16} /> Барлық жаңалықтар</Link>
      <time className="muted">{fmtDate(data.published_at ?? data.created_at)}</time>
      <h1>{data.title}</h1>
      {data.image_url && <img className="article-img" src={data.image_url} alt="" />}
      <div className="article-body">
        {isHtml(data.content)
          ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }} />
          : data.content.split(/\n{1,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </article>
  );
}
