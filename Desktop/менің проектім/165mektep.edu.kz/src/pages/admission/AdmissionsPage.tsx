import { useMemo, useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import ApplicationDetail from '../../components/admission/ApplicationDetail';
import { AppBadge, RequiredProgress, StatCard } from '../../components/admission/ui';
import { api } from '../../lib/api';
import { admissionErrorText, APP_STATUS_LABEL, APP_STATUS_ORDER } from '../../lib/admission';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import { prettyFromE164 } from '../../lib/phone';
import type { AdmissionApplication, AdmissionApplicationStatus, AdmissionDashboardData } from '../../types';

type Filter = AdmissionApplicationStatus | 'all';

export default function AdmissionsPage({ embedded }: { embedded?: boolean }) {
  const list = useAsync(() => api.admission.applications('', ''), []);
  const stats = useAsync<AdmissionDashboardData | null>(
    () => api.admission.dashboard().catch(() => null), [],
  );
  useRealtime(
    ['admission_applications', 'admission_documents', 'admission_document_requirements'],
    () => { list.reload(); stats.reload(); },
  );

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const all = list.data?.applications ?? [];
  const permissions = list.data?.permissions;
  const role = permissions?.role;

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: all.length };
    APP_STATUS_ORDER.forEach((s) => { base[s] = 0; });
    all.forEach((a) => { base[a.status] = (base[a.status] ?? 0) + 1; });
    return base;
  }, [all]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (!q) return true;
      const hay = [a.student_first_name, a.student_last_name, `${a.student_last_name} ${a.student_first_name}`,
        String(a.grade), a.parent?.phone ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [all, filter, query]);

  const fallback: AdmissionDashboardData = {
    total: all.length,
    new: counts.new ?? 0,
    under_review: counts.under_review ?? 0,
    incomplete: counts.documents_incomplete ?? 0,
    complete: counts.documents_complete ?? 0,
    accepted: counts.accepted ?? 0,
    pending_documents: 0,
    recent: [],
  };
  const d = stats.data ?? fallback;

  const open = (a: AdmissionApplication) => setSelected(a.id);

  return (
    <div className="stack-lg">
      {!embedded && (
        <div className="section-row">
          <div>
            <h1>Оқушыларды қабылдау</h1>
            <p className="muted small">Өтініштер, құжаттар және шешімдер — нақты уақыттағы деректер.</p>
          </div>
          <span className="badge badge-open">{all.length} өтініш</span>
        </div>
      )}

      {!embedded && (
        <div className="adm-stats">
          <StatCard icon="file" label="Барлық өтініш" value={d.total} />
          <StatCard icon="clock" label="Жаңа" value={d.new} accent />
          <StatCard icon="history" label="Тексерілуде" value={d.under_review} />
          <StatCard icon="shield" label="Құжаты толық емес" value={d.incomplete} />
          <StatCard icon="check" label="Қабылданды" value={d.accepted} />
        </div>
      )}

      {role === 'teacher' && permissions && !permissions.admission_documents_view && (
        <p className="adm-note"><Icon name="lock" size={15} /> Мұғалімге әзірге тек тізім мен негізгі ақпарат көрсетіледі. Құжаттар мен толық мәліметтерге рұқсатты әкімші береді.</p>
      )}

      <div className="card pad">
        <div className="toolbar">
          <input className="input search" aria-label="Өтініштерден іздеу"
            placeholder="Оқушы аты-жөні, сынып немесе телефон"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="muted small">{rows.length} / {all.length} өтініш</span>
        </div>
        <div className="adm-chips" role="tablist" aria-label="Мәртебе бойынша сүзгі">
          <button type="button" className={`adm-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Барлығы <span>{counts.all ?? 0}</span>
          </button>
          {APP_STATUS_ORDER.map((s) => (
            <button key={s} type="button" className={`adm-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {APP_STATUS_LABEL[s]} <span>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={admissionErrorText(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? (
          <Empty title="Өтініш табылмады"
            text={all.length ? 'Сүзгі талабына сай өтініш жоқ.' : 'Әзірге ешбір ата-ана өтініш бермеген.'} />
        ) : (
          <div className="adm-app-grid">
            {rows.map((a) => (
              <button type="button" key={a.id} className="adm-app-card" onClick={() => open(a)}>
                <div className="adm-app-head">
                  <span className="adm-avatar">{a.student_last_name.charAt(0)}{a.student_first_name.charAt(0)}</span>
                  <div className="adm-app-title">
                    <b>{a.student_last_name} {a.student_first_name}</b>
                    <span className="muted small">{a.grade}-сынып · {fmtDateTime(a.created_at)}</span>
                  </div>
                  <AppBadge status={a.status} />
                </div>
                {permissions?.admission_details_view && a.parent && (
                  <span className="muted small">{a.parent.last_name} {a.parent.first_name} · {prettyFromE164(a.parent.phone)}</span>
                )}
                <div className="adm-app-foot">
                  <RequiredProgress done={a.required_done} total={a.required_total} />
                  <span className="adm-open-hint">Ашу <Icon name="arrow" size={15} /></span>
                </div>
              </button>
            ))}
          </div>
        )}

      {selected && (
        <ApplicationDetail applicationId={selected} mode="staff"
          onClose={() => setSelected(null)}
          onChanged={() => { list.reload(); stats.reload(); }} />
      )}
    </div>
  );
}
