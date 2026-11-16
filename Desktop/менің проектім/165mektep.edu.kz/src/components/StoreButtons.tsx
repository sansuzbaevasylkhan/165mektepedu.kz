import { useSettings } from '../context/SettingsContext';
import { useT } from '../i18n';

function PlayGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 3l10 9-10 9z" fill="currentColor" opacity=".9" />
      <path d="M14 12l3.500-3.200 3 1.700a1.500 1.500 0 0 1 0 2.600l-3 1.700z" fill="currentColor" />
    </svg>
  );
}
function AppleGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.500 12.800c0-2.300 1.900-3.400 2-3.500-1.100-1.600-2.800-1.800-3.400-1.800-1.400-.1-2.800.9-3.500.9s-1.800-.9-3-.8c-1.500 0-3 .9-3.800 2.300-1.600 2.800-.4 7 1.200 9.300.8 1.100 1.700 2.400 2.900 2.300 1.200 0 1.600-.8 3-.8s1.800.8 3 .7c1.300 0 2.100-1.100 2.800-2.300.9-1.300 1.300-2.600 1.300-2.600s-2.500-1-2.500-3.700zM14.300 5.900c.6-.8 1.100-1.900.9-3-.9 0-2.100.6-2.700 1.400-.6.700-1.100 1.800-1 2.900 1.100.1 2.200-.5 2.800-1.300z" fill="currentColor" />
    </svg>
  );
}

/** Сілтеме жоқ болса — батырма белсенді емес ("Жақында"). Жалған сілтеме қойылмайды. */
export function StoreButtons() {
  const { settings } = useSettings();
  const t = useT();
  const appName = settings.app_name?.trim();
  const items = [
    { url: (settings.google_play_url ?? '').trim(), active: settings.google_play_active !== 'false', name: t('footer.googlePlay'), glyph: <PlayGlyph /> },
    { url: (settings.app_store_url ?? '').trim(), active: settings.app_store_active !== 'false', name: t('footer.appStore'), glyph: <AppleGlyph /> },
  ].filter((s) => s.active);
  return (
    <div className="stores">
      {items.map((s) =>
        s.url ? (
          <a key={s.name} className="store" href={s.url} target="_blank" rel="noopener noreferrer">
            {s.glyph}
            <span><small>{appName || t('footer.getOn')}</small><b>{s.name}</b></span>
          </a>
        ) : (
          <span key={s.name} className="store disabled" aria-disabled="true">
            {s.glyph}
            <span><small>{t('footer.comingSoon')}</small><b>{s.name}</b></span>
          </span>
        ),
      )}
    </div>
  );
}
