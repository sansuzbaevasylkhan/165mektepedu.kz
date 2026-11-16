import { useState, type FormEvent } from 'react';
import { Field, PasswordInput, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { Link } from 'react-router-dom';

export default function SecurityAdmin() {
  const { profile } = useAuth();
  const toast = useToast();
  const dash = useAsync(() => api.dashboard(7), []);
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (pass.length < 8) { toast.show('Құпия сөз кемінде 8 таңба болуы керек', 'error'); return; }
    if (pass !== confirm) { toast.show('Құпия сөздер сәйкес келмейді', 'error'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      setPass(''); setConfirm('');
      toast.show('Құпия сөз жаңартылды', 'success');
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const checks = [
    { t: 'Supabase Auth', d: 'Кіру тек Supabase Auth арқылы жүреді; құпия сөздер ашық сақталмайды.', ok: true },
    { t: 'Row Level Security', d: 'Барлық кестелерде RLS қосылған. Оқушы мен ата-ана тек өз деректерін көреді.', ok: true },
    { t: 'Әкімші рөлі серверде', d: 'is_admin() функциясы RLS/RPC ішінде тексеріледі. Әкімші емес пайдаланушы басқару әрекеттерін орындай алмайды.', ok: true },
    { t: 'service_role кілті', d: 'Фронтендте тек anon кілті қолданылады. service_role кілті сайт қодтарында жоқ.', ok: true },
    { t: 'ҰБТ прогрессі', d: 'Видео прогрессі, тест бағалауы және сабақтың ашылуы серверде есептеледі.', ok: true },
    { t: 'Storage', d: 'Видео жеке bucket-те; қатынас RLS арқылы тексеріледі.', ok: dash.data ? dash.data.system.storage : null },
  ];

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Қауіпсіздік</h1>
          <p className="muted small">Аккаунт қорғанысы және сервер жағындағы қорғаныс шаралары.</p>
        </div>
        <Link to="/admin/logs" className="btn btn-ghost btn-sm"><Icon name="history" size={16} /> Әрекеттер тарихы</Link>
      </div>

      <div className="grid grid-2">
        <form className="card pad form" onSubmit={change} noValidate>
          <h2>Құпия сөзді өзгерту</h2>
          <p className="muted small">Кемінде 8 таңба. Өзгеріс Supabase Auth-та бірден сақталады.</p>
          <PasswordInput id="sec-pass" label="Жаңа құпия сөз" showLabel="Көрсету" value={pass} onChange={setPass} autoComplete="new-password" />
          <PasswordInput id="sec-confirm" label="Қайталаңыз" showLabel="Көрсету" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {confirm && pass !== confirm && <p className="field-error">Құпия сөздер сәйкес келмейді</p>}
          <div className="row end"><button className="btn btn-gold" disabled={busy || !pass || pass !== confirm}>{busy ? 'Сақталуда...' : 'Жаңарту'}</button></div>
        </form>

        <div className="card pad">
          <h2>Аккаунт</h2>
          <div className="lines">
            <div className="line"><span>Аты-жөні</span><b>{profile?.last_name} {profile?.first_name}</b></div>
            <div className="line"><span>Рөлі</span><span className="badge badge-done">Әкімші</span></div>
            <div className="line"><span>Телефон</span><span>{profile?.phone}</span></div>
            <div className="line"><span>ID</span><span className="mono small">{profile?.id}</span></div>
          </div>
          <h3 className="mt">Жүйелік көрсеткіш</h3>
          {dash.loading && !dash.data ? <Spinner /> : dash.data ? (
            <div className="lines">
              <div className="line"><span>Әкімшілер</span><b>{dash.data.stats.admins}</b></div>
              <div className="line"><span>Бұғатталған аккаунт</span><b>{dash.data.stats.blocked}</b></div>
              <div className="line"><span>Белсенді (24 сағ.)</span><b>{dash.data.stats.active_24h}</b></div>
            </div>) : null}
        </div>
      </div>

      <div className="card pad">
        <h2>Қорғаныс шаралары</h2>
        <div className="grid grid-2 tight">
          {checks.map((c) => (
            <div key={c.t} className="security-item">
              <span className={`security-dot ${c.ok === false ? 'bad' : c.ok === null ? 'wait' : ''}`} />
              <div><b>{c.t}</b><p className="muted small">{c.d}</p></div>
            </div>
          ))}
        </div>
        <p className="muted small">Нақты қорғаныс Supabase жағында: RLS саясаттары мен security definer функциялары schema.sql ішінде. Интерфейс қорғанысы қосымша ғана.</p>
      </div>
    </div>
  );
}
