import { useSettings } from '../context/SettingsContext';
import { Icon } from './Icons';
import { useT } from '../i18n';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'telegram', label: 'Telegram' },
] as const;

export function SocialLinks({ big = false }: { big?: boolean }) {
  const { social } = useSettings();
  const t = useT();
  return (
    <ul className={`socials ${big ? 'big' : ''}`}>
      {PLATFORMS.map((p) => {
        const row = social.find((s) => s.platform === p.id);
        const url = row && row.is_active ? row.url.trim() : '';
        return (
          <li key={p.id}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="social" aria-label={p.label}>
                <Icon name={p.id} size={big ? 26 : 22} />
                {big && <span>{p.label}</span>}
              </a>
            ) : (
              <span className="social disabled" aria-label={`${p.label} — ${t('footer.soon')}`} title={t('footer.soon')}>
                <Icon name={p.id} size={big ? 26 : 22} />
                {big && <span>{p.label}</span>}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
