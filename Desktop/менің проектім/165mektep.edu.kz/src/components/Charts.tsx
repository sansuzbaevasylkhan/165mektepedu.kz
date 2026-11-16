const W = 640;
const H = 220;
const PAD = { l: 38, r: 14, t: 18, b: 30 };

export function LineChart({ labels, series, format = (v) => String(v) }: {
  labels: string[];
  series: { label: string; values: number[]; color?: string }[];
  format?: (value: number) => string;
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH;
  const step = Math.max(1, Math.ceil(labels.length / 7));

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.label).join(', ')}>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH * r} y2={PAD.t + innerH * r} className="chart-grid" />
            <text x={PAD.l - 8} y={PAD.t + innerH * r + 4} className="chart-tick" textAnchor="end">{format(Math.round(max * (1 - r)))}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % step === 0 ? (
          <text key={`${l}-${i}`} x={x(i)} y={H - 8} className="chart-tick" textAnchor="middle">
            {l.length > 5 ? l.slice(5) : l}
          </text>
        ) : null))}
        {series.map((s, si) => {
          const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color ?? (si === 0 ? 'var(--gold)' : 'var(--text)')} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="2.4" fill={s.color ?? (si === 0 ? 'var(--gold)' : 'var(--text)')}>
                  <title>{`${labels[i]}: ${s.label} — ${format(v)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {series.map((s, si) => (
          <span key={s.label}><i style={{ background: s.color ?? (si === 0 ? 'var(--gold)' : 'var(--text)') }} />{s.label}</span>
        ))}
      </div>
    </div>
  );
}

export function BarList({ data, suffix = '' }: { data: { label: string; value: number }[]; suffix?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bar-list">
      {data.map((d) => (
        <div key={d.label} className="bar-row">
          <span className="bar-label" title={d.label}>{d.label}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} /></span>
          <b className="bar-value">{d.value}{suffix}</b>
        </div>
      ))}
    </div>
  );
}

export function ColumnChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="columns">
      {data.map((d) => (
        <div key={d.label} className="column">
          <span className="column-value">{d.value}</span>
          <span className="column-bar" style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} title={`${d.label}: ${d.value}`} />
          <span className="column-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
