import { Link } from 'react-router-dom';
import {
  AboutSection, AchievementsSection, AdvantagesSection, DirectionsSection,
  NewsSection, SocialSection, UbtSection,
} from '../components/HomeSections';
import { Icon } from '../components/Icons';
import { HeroScenery } from '../components/HeroScenery';
import { useSeo } from '../lib/seo';
import { useSettings } from '../context/SettingsContext';
import { homeSectionOrder, parseJson, safeHref, type HomeContent } from '../lib/settings';
import { useT } from '../i18n';

function HeroCta({ to, text, gold }: { to: string; text: string; gold: boolean }) {
  const cls = `btn ${gold ? 'btn-gold' : 'btn-ghost'} btn-lg`;
  const inner = <>{text}{gold && <Icon name="arrow" size={18} />}</>;
  if (/^https?:\/\//i.test(to)) {
    return <a className={cls} href={to} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return <Link className={cls} to={to}>{inner}</Link>;
}

export default function Home() {
  const t = useT();
  const { settings } = useSettings();
  const heroImage = settings.hero_image_url || '/images/hero-school.jpg';
  const home = parseJson<HomeContent>(settings.home_content, {});
  const eyebrow = home.eyebrow?.trim() || t('brand.name');
  const heroTitle = home.hero_title?.trim() || `«${t('brand.slogan')}»`;
  const heroLead = home.hero_subtitle?.trim() || t('brand.tagline');
  const primaryText = home.primary_text?.trim() || 'ҰБТ-ға дайындалу';
  const primaryLink = safeHref(home.primary_link) || '/ubt';
  const secondaryText = home.secondary_text?.trim() || 'Мектеп туралы';
  const secondaryLink = safeHref(home.secondary_link) || '/about';

  useSeo(
    settings.seo_title?.trim() || `165 MEKTEP — ${t('brand.slogan')}`,
    settings.seo_description?.trim() || 'Заманауи мектеп порталы: жаңалықтар, ҰБТ-ға дайындық видеосабақтары, тесттер, оқушы мен ата-анаға арналған жеке кабинет.',
    '/',
  );

  const sections = {
    about: <AboutSection key="about" title={home.about_title} intro={home.about_intro} />,
    directions: <DirectionsSection key="directions" />,
    news: <NewsSection key="news" />,
    ubt: <UbtSection key="ubt" />,
    achievements: <AchievementsSection key="achievements" />,
    advantages: <AdvantagesSection key="advantages" />,
    social: <SocialSection key="social" />,
  };

  return (
    <>
      <section className="hero hero-stage">
        <img className="hero-bg" src={heroImage} alt="" aria-hidden="true" fetchPriority="high" />
        <div className="hero-shade" aria-hidden="true" />
        <HeroScenery />
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{heroTitle}</h1>
            <p className="lead">{heroLead}</p>
            <div className="hero-cta">
              <HeroCta to={primaryLink} text={primaryText} gold />
              <HeroCta to={secondaryLink} text={secondaryText} gold={false} />
            </div>
          </div>
        </div>
      </section>

      {homeSectionOrder(settings.home_sections).map((id) => sections[id])}
    </>
  );
}
