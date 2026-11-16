import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, Spinner, useAsync } from '../components/ui';
import { PhoneInput } from '../components/PhoneInput';
import { ProgressView } from '../components/ProgressView';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { isValidPhone, prettyFromE164, toE164 } from '../lib/phone';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';
import type { LinkRow, Profile } from '../types';

function InfoCard({ profile }: { profile: Profile }) {
  const t = useT();
  return (
    <div className="card pad info-card">
      <div className="avatar big">{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</div>
      <div>
        <h2>{profile.last_name} {profile.first_name}</h2>
        <p className="muted">{t(`role.${profile.role}`)}</p>
        <p>{t('auth.phone')}: <b>{prettyFromE164(profile.phone)}</b></p>
      </div>
    </div>
  );
}

function StudentCabinet({ profile }: { profile: Profile }) {
  const t = useT();
  const toast = useToast();
  const overview = useAsync(() => api.overview(), []);
  const links = useAsync(() => api.myLinks(), []);

  const respond = async (l: LinkRow, ok: boolean) => {
    try { await api.respondLink(l.link_id, ok); links.reload(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };
  const remove = async (l: LinkRow) => {
    try { await api.removeLink(l.link_id); links.reload(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  return (
    <>
      <InfoCard profile={profile} />
      <div className="card pad">
        <h3>{t('cabinet.parentRequests')}</h3>
        {links.loading ? <Spinner />
          : !links.data?.length ? <p className="muted">Ата-ана сұранысы жоқ</p>
          : <div className="lines">
              {links.data.map((l) => (
                <div key={l.link_id} className="line">
                  <div><b>{l.last_name} {l.first_name}</b><span className="muted small"> · {prettyFromE164(l.phone)}</span></div>
                  <div className="row">
                    {l.status === 'pending' ? (
                      <>
                        <button className="btn btn-gold btn-sm" onClick={() => respond(l, true)}>{t('cabinet.approve')}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => respond(l, false)}>{t('cabinet.reject')}</button>
                      </>
                    ) : (
                      <>
                        <span className={`badge ${l.status === 'approved' ? 'badge-done' : 'badge-locked'}`}>
                          {l.status === 'approved' ? t('cabinet.approved') : t('cabinet.rejected')}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={() => remove(l)}>{t('common.delete')}</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>}
      </div>
      {overview.loading ? <Spinner />
        : overview.error || !overview.data ? <ErrorState message={friendlyError(overview.error)} onRetry={overview.reload} />
        : <ProgressView data={overview.data} linkLessons />}
    </>
  );
}

function ParentCabinet({ profile }: { profile: Profile }) {
  const t = useT();
  const toast = useToast();
  const links = useAsync(() => api.myLinks(), []);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const overview = useAsync(() => (selected ? api.overview(selected) : Promise.resolve(null)), [selected]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) { toast.show(t('auth.phoneInvalid'), 'error'); return; }
    setBusy(true);
    try {
      await api.requestLink(toE164(phone));
      toast.show(t('cabinet.requestSent'), 'success');
      setPhone('');
      links.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const remove = async (l: LinkRow) => {
    try { await api.removeLink(l.link_id); if (selected === l.user_id) setSelected(null); links.reload(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  return (
    <>
      <InfoCard profile={profile} />
      <div className="card pad">
        <h3>{t('cabinet.children')}</h3>
        {links.loading ? <Spinner />
          : !links.data?.length ? <p className="muted">{t('cabinet.noChildren')}</p>
          : <div className="lines">
              {links.data.map((l) => (
                <div key={l.link_id} className={`line ${selected === l.user_id ? 'selected' : ''}`}>
                  <div><b>{l.last_name} {l.first_name}</b><span className="muted small"> · {prettyFromE164(l.phone)}</span></div>
                  <div className="row">
                    {l.status === 'approved' ? (
                      <button className="btn btn-gold btn-sm" onClick={() => setSelected(l.user_id)}>Үлгерімін көру</button>
                    ) : (
                      <span className={`badge ${l.status === 'pending' ? 'badge-open' : 'badge-locked'}`}>
                        {l.status === 'pending' ? t('cabinet.pending') : t('cabinet.rejected')}
                      </span>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(l)}>{t('common.delete')}</button>
                  </div>
                </div>
              ))}
            </div>}
        <form onSubmit={send} className="form inline-form" noValidate>
          <h4>{t('cabinet.addChild')}</h4>
          <p className="muted small">{t('cabinet.addChildHint')}</p>
          <PhoneInput id="child-phone" label={t('auth.phone')} value={phone} onChange={setPhone} />
          <button className="btn btn-gold" disabled={busy}>{t('cabinet.sendRequest')}</button>
        </form>
      </div>

      {!selected ? <p className="muted center">{t('cabinet.selectChild')}</p>
        : overview.loading ? <Spinner />
        : overview.error || !overview.data ? <ErrorState message={friendlyError(overview.error)} onRetry={overview.reload} />
        : (
          <>
            <h2 className="section-title left">{overview.data.profile.last_name} {overview.data.profile.first_name}</h2>
            <ProgressView data={overview.data} linkLessons={false} />
          </>
        )}
    </>
  );
}

export default function Cabinet() {
  const t = useT();
  const { profile } = useAuth();
  useSeo(t('cabinet.title'), undefined, '/cabinet');
  if (!profile) return <Spinner />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'director') return <Navigate to="/direktor-admin" replace />;
  if (profile.role === 'teacher') return <Navigate to="/timetable" replace />;
  return (
    <section className="container page narrow-lg stack-lg">
      <h1>{t('cabinet.title')}</h1>
      {profile.role === 'parent' ? <ParentCabinet profile={profile} /> : <StudentCabinet profile={profile} />}
    </section>
  );
}
