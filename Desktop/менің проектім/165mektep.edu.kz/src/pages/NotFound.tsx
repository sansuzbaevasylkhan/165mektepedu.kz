import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

export default function NotFound() {
  useSeo('Бет табылмады');
  return (
    <section className="container page center-page">
      <div className="big-404 gold-text">404</div>
      <h1>Бет табылмады</h1>
      <p className="muted">Сіз іздеген бет жоқ немесе басқа жерге көшірілген.</p>
      <Link to="/" className="btn btn-gold">Басты бетке өту</Link>
    </section>
  );
}
