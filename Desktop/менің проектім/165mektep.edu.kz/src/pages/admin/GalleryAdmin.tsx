import { ContentManager } from './ContentManager';

export default function GalleryAdmin() {
  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Галерея</h1>
          <p className="muted small">Мектеп өмірінен суреттер. Суреттер «Мектеп туралы» бетіндегі фотогалереяда көрінеді.</p>
        </div>
      </div>
      <ContentManager kinds={['gallery']} title="Фотогалерея" />
    </div>
  );
}
