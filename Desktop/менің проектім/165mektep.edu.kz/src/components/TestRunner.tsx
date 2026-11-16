import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { Spinner, ErrorState, ProgressBar } from './ui';
import { useT } from '../i18n';
import type { TestPublic, TestResult } from '../types';

interface Props {
  lessonId: string;
  onFinished: (r: TestResult) => void;
}

export function TestRunner({ lessonId, onFinished }: Props) {
  const t = useT();
  const [test, setTest] = useState<TestPublic | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let alive = true;
    setTest(undefined); setError(null); setResult(null); setAnswers({}); setStarted(false);
    api.test(lessonId).then((d) => alive && setTest(d)).catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [lessonId]);

  if (error) return <ErrorState message={error} />;
  if (test === undefined) return <Spinner />;
  if (test === null || test.questions.length === 0) return <p className="muted">{t('ubt.noTest')}</p>;

  const answered = Object.keys(answers).length;
  const total = test.questions.length;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.submitTest(lessonId, answers);
      setResult(r);
      onFinished(r);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const retry = () => { setResult(null); setAnswers({}); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (result) {
    return (
      <div className={`result glass ${result.passed ? 'ok' : 'bad'}`}>
        <h3>{result.passed ? t('ubt.passed') : t('ubt.failed')}</h3>
        <div className="result-score">{result.percent}%</div>
        <p>{result.correct_count} / {result.question_count} · {result.score} / {result.max_score} балл · өту шегі {result.pass_percent}%</p>
        {!result.passed && <button className="btn btn-gold" onClick={retry}>{t('ubt.retry')}</button>}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="test-intro">
        <h3>{test.title}</h3>
        <p className="muted">{total} сұрақ · өту шегі {test.pass_percent}%</p>
        <button className="btn btn-gold" onClick={() => setStarted(true)}>{t('ubt.startTest')}</button>
      </div>
    );
  }

  return (
    <div className="test">
      <h3>{test.title}</h3>
      <ProgressBar value={(answered / total) * 100} label={`${answered} / ${total}`} slim />
      <ol className="questions">
        {test.questions.map((q) => (
          <li key={q.id} className="question glass">
            <p className="q-text">{q.text}</p>
            <div className="options" role="radiogroup" aria-label={q.text}>
              {q.options.map((o) => (
                <label key={o.id} className={`option ${answers[q.id] === o.id ? 'selected' : ''}`}>
                  <input type="radio" name={q.id} checked={answers[q.id] === o.id}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} />
                  <span>{o.text}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button className="btn btn-gold" disabled={busy || answered < total} onClick={submit}>
        {busy ? t('common.loading') : t('ubt.submit')}
      </button>
    </div>
  );
}
