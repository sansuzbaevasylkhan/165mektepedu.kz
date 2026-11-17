import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import ApplicationDetail from '../../components/admission/ApplicationDetail';
import { AppBadge, RequiredProgress, StatCard } from '../../components/admission/ui';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { admissionErrorText } from '../../lib/admission';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';

export default function DirectorDashboard() {
  const { profile } = useAuth();
  const data = useAsync(() => api.admission.dashboard(), []);
  const types = useAsync(() => api.admission.documentTypes(), []);
  useRealtime(['admission_applications', 'admission_documents', 'admission_document_types'], () => {
    data.reload(); types.reload();
  });
  const [selected, setSelected] = useState<string | null>(null);
  const d = data.data;

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Басты панель</h1>
          <p className="muted small">{profile?.last_name} {profile?.first_name} — қабылдау науқанының нақты көрсеткіштері.</p>
        </div>
        <span className="badge badge-open">DIRECTOR</span>
      </div>

      {data.loading && !d ? <Spinner />
        : data.error ? <ErrorState message={admissionErrorText(data.error)} onRetry={data.reload} />
        : !d ? <Empty title="Деректер жоқ" />
        : (
          <>
            <div className="adm-stats">
              <StatCard icon="file" label="Барлық өтініш" value={d.total} accent />
              <StatCard icon="clock" label="Жаңа" value={d.new} />
              <StatCard icon="history" label="Тексерілуде" value={d.under_review} />
              <StatCard icon="shield" label="Құжаты толық емес" value={d.incomplete} />
              <StatCard icon="check" label="Құжаты толық" value={d.complete} />
              <StatCard icon="cap" label="Қабылданған оқушы" value={d.accepted} />
            </div>

            <div className="adm-quick">
              <Link to="/direktor-admin/admissions" className="adm-quick-card">
                <Icon name="users" size={22} />
                <b>Оқушыларды қабылдау</b>
                <span className="muted small">Өтініштер тізімі және шешімдер</span>
              </Link>
              <Link to="/direktor-admin/documents" className="adm-quick-card">
                <Icon name="file" size={22} />
                <b>Құжат талаптары</b>
                <span className="muted small">{types.data?.length ?? '—'} құжат түрі</span>
              </Link>
              <Link to="/direktor-admin/documents?tab=review" className="adm-quick-card">
                <Icon name="eye" size={22} />
                <b>Тексеру</b>
                <span className="muted small">{d.pending_documents} құжат күтуде</span>
              </Link>
              <Link to="/direktor-admin/documents?tab=manage" className="adm-quick-card">
                <Icon name="settings" size={22} />
                <b>Басқару</b>
                <span className="muted small">Талаптарды өңдеу және реттеу</span>
              </Link>
            </div>

            <div className="card pad">
              <div className="section-row">
                <h3>Соңғы өтініштер</h3>
                <Link to="/direktor-admin/admissions" className="link-gold small">Барлығын көру <Icon name="arrow" size={15} /></Link>
              </div>
              {d.recent.length === 0 ? <Empty title="Өтініш жоқ" text="Ата-аналар өтініш бергенде осы жерде көрінеді." />
                : (
                  <div className="adm-app-grid">
                    {d.recent.map((a) => (
                      <button type="button" key={a.id} className="adm-app-card" onClick={() => setSelected(a.id)}>
                        <div className="adm-app-head">
                          <span className="adm-avatar">{a.student_last_name.charAt(0)}{a.student_first_name.charAt(0)}</span>
                          <div className="adm-app-title">
                            <b>{a.student_last_name} {a.student_first_name}</b>
                            <span className="muted small">{a.grade}-сынып · {fmtDateTime(a.created_at)}</span>
                          </div>
                          <AppBadge status={a.status} />
                        </div>
                        <div className="adm-app-foot">
                          <RequiredProgress done={a.required_done} total={a.required_total} />
                          <span className="adm-open-hint">Ашу <Icon name="arrow" size={15} /></span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </>
        )}

      {selected && (
        <ApplicationDetail applicationId={selected} mode="staff"
          onClose={() => setSelected(null)}
          onChanged={() => { data.reload(); types.reload(); }} />
      )}
    </div>
  );
}
