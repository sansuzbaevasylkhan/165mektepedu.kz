import { useState } from 'react';
import { Empty, ErrorState, Field, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { fmtDateTime } from '../../lib/util';
import type { TeacherReportMetrics, TeacherReportRow } from '../../types';

const STATUS: Record<string, { label: string; cls: string }> = {
  submitted: { label: 'Тексеруде', cls: 'adm-badge-warn' },
  approved: { label: 'Бекітілді', cls: 'adm-badge-ok' },
  revision: { label: 'Қайта қарау', cls: 'adm-badge-bad' },
};

function iso(d: Date) {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function weekRange() {
  const now = new Date();
  const shift = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - shift);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: iso(start), end: iso(end) };
}

export default function TeacherReports() {
  const toast = useToast();
  const range = weekRange();
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);
  const [busy, setBusy] = useState(false);
  const data = useAsync(() => api.reports.mine(), []);

  const generate = async () => {
    if (!start || !end) { toast.show('Кезеңді таңдаңыз', 'error'); return; }
    if (end < start) { toast.show('Аяқталу күні басталудан кейін болуы керек', 'error'); return; }
    setBusy(true);
    try {
      await api.reports.generate(start, end);
      toast.show('Апталық есеп құрылып, директорға жіберілді', 'success');
      data.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Апталық есеп</h1>
          <p className="muted small">Өткізілген сабақ, берілген тапсырма, тексерілген жұмыс және қатысу көрсеткіштері.</p>
        </div>
        <button className="btn btn-gold" disabled={busy} onClick={() => void generate()}>
          <Icon name="file" size={16} /> {busy ? 'Құрылуда...' : 'Есеп құру'}
        </button>
      </div>

      <div className="card pad">
        <div className="tch-form-grid">
          <Field label="Кезең басы">
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Кезең соңы">
            <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <p className="muted small tch-hint">Есеп автоматты түрде директорға жіберіледі және өзгеріссіз сақталады.</p>
      </div>

      {data.loading && !data.data ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : (data.data?.length ?? 0) === 0 ? (
          <Empty title="Есеп жоқ" text="Кезеңді таңдап, «Есеп құру» батырмасын басыңыз." />
        ) : (
          <div className="tch-report-list">
            {data.data!.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
    </div>
  );
}

function ReportCard({ report }: { report: TeacherReportRow }) {
  const s = STATUS[report.status] ?? { label: report.status, cls: 'adm-badge-muted' };
  const m: TeacherReportMetrics = report.metrics ?? {};
  const att = m.attendance ?? {};
  return (
    <div className="card pad tch-report-card">
      <div className="tch-report-head">
        <div>
          <b>{report.title}</b>
          <span className="muted small">{report.period_start} — {report.period_end} · құрылды {fmtDateTime(report.created_at)}</span>
        </div>
        <span className={`badge ${s.cls}`}>{s.label}</span>
      </div>
      <div className="tch-report-metrics">
        <span><b>{m.lessons ?? 0}</b> сабақ</span>
        <span><b>{m.assignments ?? 0}</b> тапсырма</span>
        <span><b>{m.checked ?? 0}</b> тексерілді</span>
        <span><b>{m.students ?? 0}</b> оқушы</span>
        <span><b>{m.avg_score ?? 0}</b> орташа балл</span>
      </div>
      <div className="tch-report-att">
        <span className="badge adm-badge-ok">Келді: {att.present ?? 0}</span>
        <span className="badge adm-badge-warn">Кешікті: {att.late ?? 0}</span>
        <span className="badge adm-badge-muted">Дәлелді: {att.excused ?? 0}</span>
        <span className="badge adm-badge-bad">Келмеді: {att.absent ?? 0}</span>
        {report.reviewed_at && <span className="muted small">Қаралды: {fmtDateTime(report.reviewed_at)}</span>}
      </div>
    </div>
  );
}
