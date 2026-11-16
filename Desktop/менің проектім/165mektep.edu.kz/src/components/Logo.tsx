import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export function LogoMark({ size = 40, src }: { size?: number; src?: string | null }) {
  return <img src={src || '/logo.svg'} alt="" width={size} height={size} className="logo-mark" />;
}

export function Logo({ to = '/', stacked = false }: { to?: string; stacked?: boolean }) {
  const { settings } = useSettings();
  const name = settings.school_name?.trim() || '165 MEKTEP';
  const mark = settings.logo_url?.trim() || null;
  const cut = name.lastIndexOf(' ');
  const head = cut > 0 ? name.slice(0, cut + 1) : '';
  const tail = cut > 0 ? name.slice(cut + 1) : name;
  return (
    <Link to={to} className={`logo ${stacked ? 'logo-stacked' : ''}`} aria-label={`${name} — басты бет`}>
      <LogoMark size={stacked ? 72 : 40} src={mark} />
      <span className="logo-text">{head}<b>{tail}</b></span>
    </Link>
  );
}
