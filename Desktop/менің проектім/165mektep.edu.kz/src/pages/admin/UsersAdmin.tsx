import { useMemo, useState } from 'react';
import { Empty, ErrorState, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { ProgressView } from '../../components/ProgressView';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { prettyFromE164 } from '../../lib/phone';
import { fmtDateTime } from '../../lib/util';
import type { Overview, Profile, Role } from '../../types';

interface LinkAdmin { id: string; parent_id: string; student_id: string; status: 'pending' | 'approved' | 'rejected'; created_at: string }

const ROLE_LABEL: Record<Role, string> = {
  student: 'Оқушы', parent: 'Ата-ана', admin: 'Әкімші', director: 'Директор', teacher: 'Мұғалім',
};

export default function UsersAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const { profile: me } = useAuth();
  const [tab, setTab] = useState<'student' | 'parent' | 'admin' | 'links'>('student');
  const [q, setQ] = useState('');
  const [view, setView] = useState<Overview | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const users = useAsync(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  }, []);
  const links = useAsync(async () => {
    const { data, error } = await supabase.from('parent_student_links').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LinkAdmin[];
  }, []);

  const byId = useMemo(() => new Map((users.data ?? []).map((u): [string, Profile] => [u.id, u])), [users.data]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (users.data ?? []).filter((u) => u.role === tab && (!s || `${u.last_name} ${u.first_name} ${u.phone}`.toLowerCase().includes(s)));
  }, [users.data, tab, q]);

  const setBlocked = async (u: Profile) => {
    if (u.id === me?.id) { toast.show('Өз аккаунтыңызды бұғаттай алмайсыз', 'error'); return; }
    if (!u.is_blocked && !confirm(`${u.last_name} ${u.first_name} бұғатталсын ба?`)) return;
    const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id);
    if (error) toast.show(friendlyError(error), 'error'); else users.reload();
  };

  const setRole = async (u: Profile, role: Role) => {
    if (u.id === me?.id) { toast.show('Өз рөліңізді өзгерте алмайсыз', 'error'); return; }
    if (!confirm(`Рөлді "${ROLE_LABEL[role]}" етіп өзгерту керек пе?`)) return;
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id);
    if (error) toast.show(friendlyError(error), 'error'); else users.reload();
  };

  const openProgress = async (u: Profile) => {
    setViewLoading(true);
    try { setView(await api.overview(u.id)); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
    finally { setViewLoading(false); }
  };

  const respond = async (id: string, ok: boolean) => {
    try { await api.respondLink(id, ok); links.reload(); } catch (e) { toast.show(friendlyError(e), 'error'); }
  };
  const removeLink = async (id: string) => {
    if (!confirm()) return;
    try { await api.removeLink(id); links.reload(); } catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  const name = (id: string) => { const u = byId.get(id); return u ? `${u.last_name} ${u.first_name}` : '—'; };
  const count = (r: Role) => (users.data ?? []).filter((u) => u.role === r).length;

  return (
    <div className="stack-lg">
      <h1>Пайдаланушылар</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'student' ? 'active' : ''}`} onClick={() => setTab('student')}>Оқушылар ({count('student')})</button>
        <button className={`tab ${tab === 'parent' ? 'active' : ''}`} onClick={() => setTab('parent')}>Ата-аналар ({count('parent')})</button>
        <button className={`tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>Әкімшілер ({count('admin')})</button>
        <button className={`tab ${tab === 'links' ? 'active' : ''}`} onClick={() => setTab('links')}>Байланыстар</button>
      </div>

      {users.loading && !users.data ? <Spinner />
        : users.error ? <ErrorState message={friendlyError(users.error)} onRetry={users.reload} />
        : tab === 'links' ? (
          !links.data?.length ? <Empty title="Ата-ана мен оқушы байланыстары жоқ" /> : (
            <div className="card table-wrap"><table className="table">
              <thead><tr><th>Ата-ана</th><th>Оқушы</th><th>Күйі</th><th /></tr></thead>
              <tbody>{links.data.map((l) => (
                <tr key={l.id}>
                  <td>{name(l.parent_id)}</td><td>{name(l.student_id)}</td>
                  <td><span className={`badge ${l.status === 'approved' ? 'badge-done' : l.status === 'pending' ? 'badge-open' : 'badge-locked'}`}>
                    {l.status === 'approved' ? 'Бекітілген' : l.status === 'pending' ? 'Күтуде' : 'Қабылданбады'}</span></td>
                  <td className="actions">
                    {l.status !== 'approved' && <button className="btn btn-gold btn-sm" onClick={() => respond(l.id, true)}>Бекіту</button>}
                    {l.status !== 'rejected' && <button className="btn btn-ghost btn-sm" onClick={() => respond(l.id, false)}>Қабылдамау</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => removeLink(l.id)}>Өшіру</button>
                  </td>
                </tr>))}</tbody>
            </table></div>)
        ) : (
          <>
            <input className="input search" placeholder="Аты-жөні немесе телефон бойынша іздеу" value={q} onChange={(e) => setQ(e.target.value)} />
            {rows.length === 0 ? <Empty title="Пайдаланушылар табылмады" /> : (
              <div className="card table-wrap"><table className="table">
                <thead><tr><th>Аты-жөні</th><th>Телефон</th><th>Рөл</th><th>Тіркелген</th><th>Соңғы кіру</th><th /></tr></thead>
                <tbody>{rows.map((u) => (
                  <tr key={u.id} className={u.is_blocked ? 'blocked' : ''}>
                    <td><b>{u.last_name} {u.first_name}</b>{u.is_blocked && <span className="badge badge-locked"> бұғатталған</span>}</td>
                    <td>{prettyFromE164(u.phone)}</td>
                    <td>
                      <select className="input compact" value={u.role} onChange={(e) => void setRole(u, e.target.value as Role)}>
                        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td className="muted">{fmtDateTime(u.created_at)}</td>
                    <td className="muted">{u.last_seen_at ? fmtDateTime(u.last_seen_at) : '—'}</td>
                    <td className="actions">
                      {u.role === 'student' && <button className="btn btn-ghost btn-sm" disabled={viewLoading} onClick={() => openProgress(u)}>Прогресс</button>}
                      <button className={`btn btn-sm ${u.is_blocked ? 'btn-gold' : 'btn-danger'}`} onClick={() => setBlocked(u)}>{u.is_blocked ? 'Ашу' : 'Бұғаттау'}</button>
                    </td>
                  </tr>))}</tbody>
              </table></div>)}
          </>)}

      {view && (
        <Modal title={`${view.profile.last_name} ${view.profile.first_name} — прогресс`} onClose={() => setView(null)} wide>
          <ProgressView data={view} linkLessons={false} />
        </Modal>)}
    </div>
  );
}
