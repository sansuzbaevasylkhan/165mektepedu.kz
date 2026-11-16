import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, ProgressBar, Spinner, useAsync } from '../../components/ui';
import { BarList, ColumnChart, LineChart } from '../../components/Charts';
import { Icon, type IconName } from '../../components/Icons';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { fmtDateTime } from '../../lib/util';
import { prettyFromE164 } from '../../lib/phone';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ACTION: Record<string, string> = { INSERT: 'қосты', UPDATE: 'өзгертті', DELETE: 'өшірді' };
const ENTITY: Record<string, string> = {
  news: 'жаңалық', subjects: 'пән', lessons: 'сабақ', tests: 'тест', questions: 'сұрақ',
  site_settings: 'сайт баптауы', social_links: 'әлеуметтік сілтеме', content_items: 'мазмұн',
  parent_student_links: 'ата-ана байланысы', profiles: 'пайдаланушы',
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.dashboard(14), []);

  useEffect(() => {
    const ch = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' }, () => reload())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => reload())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'test_attempts' }, () => reload())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;

  const s = data.stats;
  const cards: { label: string; value: number | string; icon: IconName; sub?: string }[] = [
    { label: 'Оқушылар', value: s.students, icon: 'cap', sub: `${s.blocked} бұғатталған` },
    { label: 'Ата-аналар', value: s.parents, icon: 'users' },
    { label: 'Белсенді (24 сағ.)', value: s.active_24h, icon: 'spark' },
    { label: 'ҰБТ сабақтары', value: s.lessons, icon: 'video', sub: `${s.lessons_published} жарияланған` },
    { label: 'Тесттер', value: s.tests, icon: 'file', sub: `${s.questions} сұрақ` },
    { label: 'Тест әрекеттері', value: s.attempts, icon: 'check', sub: `${s.avg_score}% орташа` },
    { label: 'Аяқталған сабақ', value: s.completed_lessons, icon: 'trophy' },
    { label: 'Орташа прогресс', value: `${s.avg_progress}%`, icon: 'chart' },
  ];

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Басты панель</h1>
          <p className="muted small">Қош келдіңіз, {profile?.first_name}! Барлық деректер Supabase-тен нақты уақытта алынады.</p>
        </div>
        <span className="badge badge-open">Live</span>
      </div>

      <div className="grid grid-4">
        {cards.map((c) => (
          <div key={c.label} className="card pad stat">
            <div className="adv-icon"><Icon name={c.icon} size={22} /></div>
            <div><div className="stat-n">{c.value}</div><div className="muted small">{c.label}</div>{c.sub && <div className="muted xs">{c.sub}</div>}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <h3>Тіркелу динамикасы (14 күн)</h3>
          <LineChart labels={data.registrations.map((d) => d.day)} series={[
            { label: 'Оқушылар', values: data.registrations.map((d) => d.students ?? 0) },
            { label: 'Ата-аналар', values: data.registrations.map((d) => d.parents ?? 0), color: 'var(--muted)' },
          ]} />
        </div>
        <div className="card pad">
          <h3>Күнделікті белсенділік</h3>
          <LineChart labels={data.activity.map((d) => d.day)} series={[
            { label: 'Тест тапсыру', values: data.activity.map((d) => d.attempts ?? 0) },
            { label: 'Аяқталған сабақ', values: data.activity.map((d) => d.completed ?? 0), color: 'var(--muted)' },
          ]} />
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card pad">
          <h3>Пәндер нәтижесі</h3>
          <BarList suffix="%" data={data.subjects.map((x) => ({ label: x.title, value: x.avg_score }))} />
        </div>
        <div className="card pad">
          <h3>Тест нәтижелері</h3>
          <ColumnChart data={data.scores.map((x) => ({ label: x.range, value: x.count }))} />
        </div>
        <div className="card pad">
          <h3>Үздік оқушылар</h3>
          <BarList suffix="%" data={data.top_students.slice(0, 6).map((x) => ({ label: `${x.last_name} ${x.first_name}`, value: x.percent }))} />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <div className="section-row"><h3>Соңғы тіркелулер</h3><Link className="link-gold small" to="/admin/students">Барлығы</Link></div>
          {data.recent_students.length === 0 ? <p className="muted">Әзірге жоқ</p> : (
            <div className="lines">
              {data.recent_students.map((u) => (
                <div key={u.id} className="line">
                  <div><b>{u.last_name} {u.first_name}</b><span className="muted small"> · {prettyFromE164(u.phone)}</span></div>
                  <div className="row">
                    <span className="muted small">{u.percent}%</span>
                    <span className={`badge ${u.is_blocked ? 'badge-locked' : 'badge-done'}`}>{u.is_blocked ? 'Бұғатталған' : 'Белсенді'}</span>
                  </div>
                </div>
              ))}
            </div>)}
        </div>

        <div className="card pad">
          <div className="section-row"><h3>Соңғы әрекеттер</h3><Link className="link-gold small" to="/admin/logs">Барлығы</Link></div>
          {data.recent_logs.length === 0 ? <p className="muted">Әзірге әрекеттер жоқ</p> : (
            <div className="lines">
              {data.recent_logs.map((l) => (
                <div key={l.id} className="line">
                  <span><b>{l.actor}</b> {ENTITY[l.entity] ?? l.entity} {ACTION[l.action] ?? l.action}</span>
                  <span className="muted small">{fmtDateTime(l.created_at)}</span>
                </div>
              ))}
            </div>)}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <div className="section-row"><h3>Соңғы жаңалықтар</h3><Link className="link-gold small" to="/admin/news">Барлығы</Link></div>
          {data.recent_news.length === 0 ? <p className="muted">Жаңалықтар жоқ</p> : (
            <div className="lines">
              {data.recent_news.map((n) => (
                <div key={n.id} className="line">
                  <div className="row">
                    {n.image_url && <img src={n.image_url} alt="" className="thumb" />}
                    <span><b>{n.title}</b></span>
                  </div>
                  <span className={`badge ${n.published ? 'badge-done' : 'badge-locked'}`}>{n.published ? 'Жарияланған' : 'Жоба'}</span>
                </div>
              ))}
            </div>)}
        </div>

        <div className="card pad">
          <h3>Жүйе күйі</h3>
          <div className="lines">
            <div className="line"><span>Дерекқор (Supabase)</span><span className={`badge ${data.system.database ? 'badge-done' : 'badge-locked'}`}>{data.system.database ? 'Қосылған' : 'Қосылмаған'}</span></div>
            <div className="line"><span>Storage</span><span className={`badge ${data.system.storage ? 'badge-done' : 'badge-locked'}`}>{data.system.storage ? 'Дайын' : 'Тексеріңіз'}</span></div>
            <div className="line"><span>Auth</span><span className={`badge ${data.system.auth ? 'badge-done' : 'badge-locked'}`}>{data.system.auth ? 'Белсенді' : 'Қате'}</span></div>
            <div className="line"><span>Сервер уақыты</span><span className="muted small">{fmtDateTime(data.system.server_time)}</span></div>
            <div className="line"><span>Сайт</span><span className="muted small">165mektep.edu.kz</span></div>
          </div>
          <h3 className="mt">Қамту</h3>
          <ProgressBar value={s.avg_progress} label="Орташа прогресс" />
          <p className="muted small">{s.completed_lessons} сабақ аяқталған · {s.news_published}/{s.news} жаңалық жарияланған</p>
        </div>
      </div>
    </div>
  );
}
