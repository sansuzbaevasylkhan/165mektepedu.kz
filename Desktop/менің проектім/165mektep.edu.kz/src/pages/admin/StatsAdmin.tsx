import { BarList, ColumnChart, LineChart } from '../../components/Charts';
import { ErrorState, Spinner, useAsync } from '../../components/ui';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { prettyFromE164 } from '../../lib/phone';

export default function StatsAdmin() {
  const { data, error, loading, reload } = useAsync(() => api.dashboard(30), []);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;

  const labels = data.registrations.map((d) => d.day);

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h1>Статистика</h1>
        <span className="badge badge-open">Соңғы {data.days} күн</span>
      </div>

      <div className="grid grid-3">
        <div className="card pad stat"><div><div className="stat-n">{data.stats.students}</div><div className="muted">Оқушылар</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{data.stats.avg_progress}%</div><div className="muted">Орташа прогресс</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{data.stats.attempts}</div><div className="muted">Тест әрекеттері</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{data.stats.avg_score}%</div><div className="muted">Орташа тест нәтижесі</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{data.stats.active_24h}</div><div className="muted">Белсенді (24 сағ.)</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{data.stats.new_7d}</div><div className="muted">Жаңа тіркелу (7 күн)</div></div></div>
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <h3>Тіркелу динамикасы</h3>
          <LineChart labels={labels} series={[
            { label: 'Оқушылар', values: data.registrations.map((d) => d.students ?? 0) },
            { label: 'Ата-аналар', values: data.registrations.map((d) => d.parents ?? 0), color: 'var(--muted)' },
          ]} />
        </div>
        <div className="card pad">
          <h3>Күнделікті белсенділік</h3>
          <LineChart labels={labels} series={[
            { label: 'Тест тапсыру', values: data.activity.map((d) => d.attempts ?? 0) },
            { label: 'Аяқталған сабақ', values: data.activity.map((d) => d.completed ?? 0), color: 'var(--muted)' },
          ]} />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <h3>Пәндер бойынша орташа нәтиже</h3>
          <BarList suffix="%" data={data.subjects.filter((s) => s.avg_score > 0).map((s) => ({ label: s.title, value: s.avg_score }))} />
        </div>
        <div className="card pad">
          <h3>Тест нәтижелерінің таралуы</h3>
          <ColumnChart data={data.scores.map((s) => ({ label: s.range, value: s.count }))} />
        </div>
      </div>

      <div className="card pad">
        <h3>Үздік оқушылар</h3>
        {data.top_students.length === 0 ? <p className="muted">Деректер әзірге жоқ.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Оқушы</th><th>Телефон</th><th>Прогресс</th><th>Аяқталған</th><th>Орташа тест</th></tr></thead>
              <tbody>
                {data.top_students.slice(0, 10).map((s, i) => (
                  <tr key={s.id}>
                    <td className="muted">{i + 1}</td>
                    <td><b>{s.last_name} {s.first_name}</b></td>
                    <td>{prettyFromE164(s.phone)}</td>
                    <td><b className="gold-text">{s.percent}%</b></td>
                    <td>{s.lessons_done}</td>
                    <td>{s.avg_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}
      </div>

      <div className="card pad">
        <h3>Пәндер кестесі</h3>
        {data.subjects.length === 0 ? <p className="muted">Пәндер жоқ.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Пән</th><th>Сабақ</th><th>Аяқтау</th><th>Орташа видео</th><th>Орташа тест</th></tr></thead>
              <tbody>
                {data.subjects.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.title}</b></td><td>{s.lessons}</td><td>{s.completions}</td>
                    <td>{s.avg_video}%</td><td>{s.avg_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>
  );
}
