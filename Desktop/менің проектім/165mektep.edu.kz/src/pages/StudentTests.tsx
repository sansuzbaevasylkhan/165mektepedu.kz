import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, ErrorState, Modal, Spinner, useAsync } from '../components/ui';
import { Icon } from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useRealtime } from '../lib/useRealtime';
import { fmtDateTime } from '../lib/util';
import { useSeo } from '../lib/seo';
import type { ClassTestSubmitResult, RunningClassTest } from '../types';

export default function StudentTests() {
  useSeo('Онлайн тесттер', undefined, '/cabinet/tests');
  const toast = useToast();
  const available = useAsync(() => api.tests.available(), []);
  const attempts = useAsync(() => api.tests.myAttempts(), []);
  useRealtime(['class_tests', 'class_test_attempts'], () => { available.reload(); attempts.reload(); });

  const [runner, setRunner] = useState<RunningClassTest | null>(null);
  const [result, setResult] = useState<ClassTestSubmitResult | null>(null);

  const start = async (id: string) => {
    try { setRunner(await api.tests.start(id)); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  const finish = (r: ClassTestSubmitResult) => {
    setRunner(null);
    setResult(r);
    available.reload();
    attempts.reload();
  };

  return (
    <section className="container page narrow-lg stack-lg tch-page">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">Оқушы кабинеті</span>
          <h1>Онлайн тесттер</h1>
          <p className="muted small">Мұғалім жіберген тесттерді тапсырыңыз. Жауаптар серверде тексеріледі.</p>
        </div>
        <Link to="/cabinet" className="btn btn-ghost"><Icon name="home" size={16} /> Кабинет</Link>
      </div>

      <section className="stack">
        <h2 className="section-title left">Қолжетімді тесттер</h2>
        {available.loading && !available.data ? <Spinner />
          : available.error ? <ErrorState message={friendlyError(available.error)} onRetry={available.reload} />
          : (available.data?.length ?? 0) === 0 ? <Empty title="Белсенді тест жоқ" text="Мұғалім тест жариялағанда осында көрінеді." />
          : (
            <div className="tch-test-list">
              {available.data!.map((t) => {
                const left = Math.max(0, t.max_attempts - t.attempts_used);
                return (
                  <div className="card pad tch-test-card" key={t.id}>
                    <div className="tch-test-head">
                      <div>
                        <div className="tch-badges">
                          <span className="badge adm-badge-muted">{t.subject_title}</span>
                          <span className="badge adm-badge-muted">{t.class_name}</span>
                          <span className="badge badge-open">{t.questions} сұрақ</span>
                          <span className="badge adm-badge-muted">{t.time_limit_minutes} мин</span>
                        </div>
                        <h3>{t.title}</h3>
                        <p className="muted small">
                          Өту шегі {t.pass_percent}% · Қалған әрекет {left}/{t.max_attempts}
                          {t.best_percent != null ? ` · Ең жақсы нәтиже ${t.best_percent.toFixed(0)}%` : ''}
                        </p>
                        {t.description && <p className="tch-assign-desc">{t.description}</p>}
                      </div>
                      <button className="btn btn-gold" disabled={left <= 0} onClick={() => void start(t.id)}>
                        <Icon name="check" size={15} /> {left > 0 ? 'Тестті бастау' : 'Әрекет бітті'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </section>

      <section className="stack">
        <h2 className="section-title left">Менің әрекеттерім</h2>
        {attempts.loading && !attempts.data ? <Spinner />
          : attempts.error ? <ErrorState message={friendlyError(attempts.error)} onRetry={attempts.reload} />
          : (attempts.data?.length ?? 0) === 0 ? <p className="muted small">Әзірге тапсырылған тест жоқ.</p>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Тест</th><th>Пән</th><th>Нәтиже</th><th>Мәртебе</th><th>Уақыты</th></tr></thead>
                <tbody>
                  {attempts.data!.map((a) => (
                    <tr key={a.id}>
                      <td><b>{a.title}</b></td>
                      <td className="muted">{a.subject_title}</td>
                      <td>{a.status === 'submitted' ? `${a.score}/${a.max_score} · ${a.percent.toFixed(0)}%` : '—'}</td>
                      <td>
                        {a.status === 'in_progress'
                          ? <span className="badge adm-badge-warn">Аяқталмаған</span>
                          : <span className={`badge ${a.passed ? 'adm-badge-ok' : 'adm-badge-bad'}`}>
                              {a.passed ? 'Өтті' : 'Өтпеді'}
                            </span>}
                      </td>
                      <td className="muted small">{a.finished_at ? fmtDateTime(a.finished_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {runner && <TestRunner run={runner} onCancel={() => setRunner(null)} onDone={finish} />}
      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
    </section>
  );
}

function TestRunner({ run, onCancel, onDone }: {
  run: RunningClassTest; onCancel: () => void; onDone: (r: ClassTestSubmitResult) => void;
}) {
  const toast = useToast();
  const t = run.test;
  const deadline = useMemo(
    () => new Date(new Date(run.started_at).getTime() + t.time_limit_minutes * 60000).getTime(),
    [run.started_at, t.time_limit_minutes],
  );
  const [now, setNow] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const leftSec = Math.max(0, Math.floor((deadline - now) / 1000));
  const mm = String(Math.floor(leftSec / 60)).padStart(2, '0');
  const ss = String(leftSec % 60).padStart(2, '0');
  const answered = Object.keys(answers).length;

  const submit = async (auto = false) => {
    if (submitted) return;
    setSubmitted(true);
    setBusy(true);
    try {
      const r = await api.tests.submit(run.attempt_id, answers);
      if (auto) toast.show('Уақыт бітті — жауаптар автоматты түрде жіберілді', 'error');
      onDone(r);
    } catch (e) {
      setSubmitted(false);
      toast.show(friendlyError(e), 'error');
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (leftSec === 0 && !submitted) void submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSec === 0]);

  return (
    <div className="modal-back">
      <div className="modal glass wide tch-runner" role="dialog" aria-modal="true" aria-label={t.title}>
        <div className="modal-head">
          <div>
            <h3>{t.title}</h3>
            <p className="muted small">{t.subject_title} · {t.questions.length} сұрақ · өту шегі {t.pass_percent}%</p>
          </div>
          <span className={`tch-timer ${leftSec <= 60 ? 'danger' : ''}`}>
            <Icon name="clock" size={16} /> {mm}:{ss}
          </span>
        </div>
        <div className="modal-body">
          <div className="stack">
            {t.questions.map((q, qi) => (
              <div className="card pad tch-q-card" key={q.id}>
                <div className="tch-q-head">
                  <b>{qi + 1}. {q.text}</b>
                  <span className="badge adm-badge-muted">{q.points} балл</span>
                </div>
                <div className="tch-options">
                  {q.options.map((o) => (
                    <label key={o.id} className={`tch-answer ${answers[q.id] === o.id ? 'active' : ''}`}>
                      <input type="radio" name={q.id} checked={answers[q.id] === o.id}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} />
                      <span>{o.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tch-modal-actions">
          <span className="muted small grow">Жауап берілді: {answered}/{t.questions.length}</span>
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Шығу</button>
          <button className="btn btn-gold" onClick={() => void submit(false)} disabled={busy}>
            {busy ? 'Жіберілуде…' : 'Аяқтау және жіберу'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ result, onClose }: { result: ClassTestSubmitResult; onClose: () => void }) {
  return (
    <Modal title="Тест нәтижесі" onClose={onClose}>
      <div className="stack center">
        <div className="tch-progress-ring">
          <b>{result.percent.toFixed(0)}%</b>
          <span>{result.score}/{result.max_score} балл</span>
        </div>
        <p>
          <span className={`badge ${result.passed ? 'adm-badge-ok' : 'adm-badge-bad'}`}>
            {result.passed ? 'Тесттен өттіңіз' : 'Өту шегіне жетпеді'}
          </span>
        </p>
        <p className="muted small">
          Дұрыс жауап: {result.correct_count}/{result.question_count} · Өту шегі: {result.pass_percent}%
        </p>
      </div>
      <div className="tch-modal-actions">
        <button className="btn btn-gold" onClick={onClose}>Жабу</button>
      </div>
    </Modal>
  );
}
