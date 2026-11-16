import { Link } from 'react-router-dom';
import { Empty, ProgressBar, Ring } from './ui';
import { Icon, type IconName } from './Icons';
import { useT } from '../i18n';
import { fmtDateTime, lessonPercent, overallPercent } from '../lib/util';
import type { Overview } from '../types';

export function computeAchievements(o: Overview) {
  const total = o.lessons.length;
  const done = o.lessons.filter((l) => l.completed).length;
  const overall = overallPercent(o.lessons);
  const list: { id: string; icon: IconName; title: string; text: string; got: boolean }[] = [
    { id: 'first-video', icon: 'play', title: 'Алғашқы қадам', text: 'Бірінші видеосабақты соңына дейін көру', got: o.lessons.some((l) => l.video_completed) },
    { id: 'first-lesson', icon: 'check', title: 'Алғашқы сабақ', text: 'Бірінші сабақты толық аяқтау', got: done >= 1 },
    { id: 'five', icon: 'star', title: 'Бес сабақ', text: '5 сабақты толық аяқтау', got: done >= 5 },
    { id: 'half', icon: 'chart', title: 'Жарты жол', text: 'Жалпы прогресс 50%-ға жету', got: total > 0 && overall >= 50 },
    { id: 'perfect', icon: 'trophy', title: 'Үздік нәтиже', text: 'Тестті 100%-ға тапсыру', got: o.attempts.some((a) => a.percent === 100) },
    { id: 'all', icon: 'cap', title: 'Барлық сабақ', text: 'Барлық сабақтарды аяқтау', got: total > 0 && done === total },
  ];
  return list;
}

export function ProgressView({ data, linkLessons }: { data: Overview; linkLessons: boolean }) {
  const t = useT();
  const overall = overallPercent(data.lessons);
  const completed = data.lessons.filter((l) => l.completed);
  const remaining = data.lessons.filter((l) => !l.completed);
  const ach = computeAchievements(data);

  const LessonLine = ({ l }: { l: Overview['lessons'][number] }) => {
    const inner = (
      <>
        <div><b>{l.title}</b><span className="muted small"> · {l.subject_title}</span></div>
        <span className="badge badge-open">{lessonPercent(l)}%</span>
      </>
    );
    return linkLessons && l.unlocked
      ? <Link to={`/ubt/lesson/${l.lesson_id}`} className="line">{inner}</Link>
      : <div className="line">{inner}</div>;
  };

  return (
    <div className="progress-view">
      <div className="card pad overall">
        <Ring value={overall} />
        <div className="overall-info">
          <h3>{t('cabinet.overall')}</h3>
          <p className="muted">{completed.length} / {data.lessons.length} {t('ubt.lessons').toLowerCase()} аяқталды</p>
          <ProgressBar value={overall} />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <h3>{t('cabinet.completed')}</h3>
          {completed.length === 0 ? <p className="muted">{t('cabinet.noCompleted')}</p>
            : <div className="lines">{completed.map((l) => <LessonLine key={l.lesson_id} l={l} />)}</div>}
        </div>
        <div className="card pad">
          <h3>{t('cabinet.remaining')}</h3>
          {remaining.length === 0 ? <p className="muted">{t('cabinet.noRemaining')}</p>
            : <div className="lines">{remaining.map((l) => <LessonLine key={l.lesson_id} l={l} />)}</div>}
        </div>
      </div>

      <div className="card pad">
        <h3>{t('cabinet.results')}</h3>
        {data.attempts.length === 0 ? <p className="muted">{t('cabinet.noResults')}</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Сабақ</th><th>Нәтиже</th><th>Күйі</th><th>Күні</th></tr></thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.lesson_title}</td>
                    <td><b>{a.percent}%</b></td>
                    <td><span className={`badge ${a.passed ? 'badge-done' : 'badge-locked'}`}>{a.passed ? 'Өтті' : 'Өтпеді'}</span></td>
                    <td className="muted">{fmtDateTime(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card pad">
        <h3>{t('cabinet.achievements')}</h3>
        {!ach.some((a) => a.got) && <p className="muted">{t('cabinet.noAchievements')}</p>}
        <div className="grid grid-3 tight">
          {ach.map((a) => (
            <div key={a.id} className={`achv ${a.got ? 'got' : ''}`}>
              <Icon name={a.got ? a.icon : 'lock'} size={24} />
              <div><b>{a.title}</b><p className="muted small">{a.text}</p></div>
            </div>
          ))}
        </div>
      </div>
      {data.lessons.length === 0 && <Empty title="Сабақтар әзірге жоқ" />}
    </div>
  );
}
