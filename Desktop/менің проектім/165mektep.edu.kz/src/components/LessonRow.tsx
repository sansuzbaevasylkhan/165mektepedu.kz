import { Link } from 'react-router-dom';
import { Icon } from './Icons';
import { useT } from '../i18n';
import { fmtDuration, lessonPercent } from '../lib/util';
import type { LessonStatus } from '../types';

export function LessonRow({ lesson, index }: { lesson: LessonStatus; index: number }) {
  const t = useT();
  const pct = lessonPercent(lesson);
  const state = lesson.completed ? 'done' : lesson.unlocked ? 'open' : 'locked';
  const body = (
    <>
      <div className={`lesson-n ${state}`}>
        {state === 'done' ? <Icon name="check" size={20} /> : state === 'locked' ? <Icon name="lock" size={18} /> : index + 1}
      </div>
      <div className="lesson-main">
        <h4>{lesson.title}</h4>
        <p className="muted small">{fmtDuration(lesson.duration_seconds)}{lesson.has_test ? ' · тест бар' : ''}</p>
        {state !== 'locked' && (
          <div className="lesson-stats small">
            <span>{t('ubt.video')}: <b>{lesson.video_percent}%</b></span>
            {lesson.has_test && <span>{t('ubt.test')}: <b>{lesson.test_passed ? '100%' : `${lesson.best_score}%`}</b></span>}
          </div>
        )}
      </div>
      <div className="lesson-side">
        <span className={`badge badge-${state}`}>
          {state === 'done' ? t('ubt.done') : state === 'open' ? (pct > 0 ? t('ubt.inProgress') : t('ubt.open')) : t('ubt.locked')}
        </span>
      </div>
    </>
  );
  return state === 'locked' ? (
    <div className="lesson-row locked" aria-disabled="true">{body}</div>
  ) : (
    <Link to={`/ubt/lesson/${lesson.lesson_id}`} className="lesson-row">{body}</Link>
  );
}
