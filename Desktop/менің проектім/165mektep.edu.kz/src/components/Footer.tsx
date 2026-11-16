import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Icon } from './Icons';
import { SocialLinks } from './SocialLinks';
import { StoreButtons } from './StoreButtons';
import { useSettings } from '../context/SettingsContext';
import { useT } from '../i18n';

export function ContactList() {
  const { settings } = useSettings();
  const t = useT();
  const rows = [
    { icon: 'pin' as const, label: t('footer.address'), value: settings.address, href: '' },
    { icon: 'phone' as const, label: t('footer.phone'), value: settings.phone, href: settings.phone ? `tel:${settings.phone.replace(/[^\d+]/g, '')}` : '' },
    { icon: 'mail' as const, label: t('footer.email'), value: settings.email, href: settings.email ? `mailto:${settings.email}` : '' },
    { icon: 'clock' as const, label: t('footer.hours'), value: settings.working_hours, href: '' },
  ];
  return (
    <ul className="contact-list">
      {rows.map((r) => (
        <li key={r.label}>
          <Icon name={r.icon} size={18} />
          <div>
            <small>{r.label}</small>
            {r.value ? (r.href ? <a href={r.href}>{r.value}</a> : <span>{r.value}</span>) : <span className="muted">{t('footer.soon')}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const t = useT();
  const { settings } = useSettings();
  const school = settings.school_name?.trim() || '165 MEKTEP';
  const about = settings.footer_about?.trim() || t('footer.about');
  const rights = settings.copyright?.trim() || `© ${new Date().getFullYear()} ${school}. ${t('footer.rights')}`;
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col footer-brand">
          <Logo />
          <p>{about}</p>
          <p className="gold-text slogan">«{t('brand.slogan')}»</p>
        </div>
        <div className="footer-col">
          <h4>{t('footer.quick')}</h4>
          <ul className="footer-links">
            <li><Link to="/">{t('nav.home')}</Link></li>
            <li><Link to="/news">{t('nav.news')}</Link></li>
            <li><Link to="/about">{t('nav.about')}</Link></li>
            <li><Link to="/ubt">{t('nav.ubt')}</Link></li>
            <li><Link to="/register">{t('nav.register')}</Link></li>
            <li><Link to="/login">{t('nav.login')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('footer.contact')}</h4>
          <ContactList />
        </div>
        <div className="footer-col">
          <h4>{t('footer.social')}</h4>
          <SocialLinks />
          <h4 className="mt">{t('footer.apps')}</h4>
          <StoreButtons />
        </div>
      </div>
      <div className="container footer-bottom">
        <span>{rights}</span>
        <span className="footer-legal">
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
        </span>
      </div>
    </footer>
  );
}
