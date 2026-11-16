import { Link } from 'react-router-dom';
import { fmtDate } from '../lib/util';
import { Icon } from './Icons';
import type { NewsItem } from '../types';

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link to={`/news/${item.id}`} className="card news-card">
      <div className="news-img">
        {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : <div className="news-ph"><Icon name="news" size={40} /></div>}
      </div>
      <div className="news-body">
        <time className="muted small">{fmtDate(item.published_at ?? item.created_at)}</time>
        <h3>{item.title}</h3>
        {item.excerpt && <p>{item.excerpt}</p>}
        <span className="more">Толығырақ <Icon name="arrow" size={16} /></span>
      </div>
    </Link>
  );
}
