import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icons';
import type { AppNotification } from '../types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'қазір';
  if (min < 60) return `${min} мин бұрын`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} сағ бұрын`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} күн бұрын`;
  return new Date(iso).toLocaleDateString('kk-KZ');
}

function pushBrowser(n: AppNotification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const item = new Notification(n.title, { body: n.body, tag: n.id });
    item.onclick = () => { window.focus(); item.close(); };
  } catch {
    /* кейбір браузерлер Notification-ды тек service worker арқылы қолдайды */
  }
}

export function NotificationsBell() {
  const { profile, isStaff } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.notifications.mine(40).then(setItems).catch(() => { /* желі қатесі — келесі realtime оқиғасында жаңарады */ });
  }, []);

  useEffect(() => {
    if (!profile || !isStaff) return;
    load();
  }, [profile, isStaff, load]);

  useEffect(() => {
    if (!profile || !isStaff) return;
    const ch = supabase
      .channel(`notif-${profile.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 40)));
          pushBrowser(n);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [profile, isStaff, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!profile || !isStaff) return null;

  const unread = items.filter((n) => !n.read_at).length;

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read_at) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      await api.notifications.markRead(n.id).catch(() => { /* оқылды белгісі кейін қайталанады */ });
    }
    if (n.link) nav(n.link);
  };

  const markAll = async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })));
    await api.notifications.markAllRead().catch(() => { /* келесі синхрондауда түзетіледі */ });
  };

  const askPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch {
      /* рұқсат сұрау қолданылмайды */
    }
  };

  return (
    <div className="notif" ref={box}>
      <button
        type="button"
        className={`icon-btn notif-btn ${open ? 'active' : ''}`}
        aria-label={unread ? `Хабарламалар: ${unread} оқылмаған` : 'Хабарламалар'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel glass" role="dialog" aria-label="Хабарламалар">
          <div className="notif-head">
            <b>Хабарламалар</b>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={() => void markAll()}>
                Барлығын оқылды
              </button>
            )}
          </div>

          {permission === 'default' && (
            <button type="button" className="notif-perm" onClick={() => void askPermission()}>
              <Icon name="bell" size={16} />
              Браузер хабарламаларын қосу
            </button>
          )}

          <div className="notif-list">
            {items.length === 0 && <p className="notif-empty">Әзірге хабарлама жоқ.</p>}
            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                className={`notif-item ${n.read_at ? '' : 'unread'}`}
                onClick={() => void openItem(n)}
              >
                <span className={`notif-kind ${n.kind}`}><Icon name={n.kind === 'task' ? 'clipboard' : n.kind === 'account' ? 'user' : 'bell'} size={15} /></span>
                <span className="notif-body">
                  <span className="notif-title">{n.title}</span>
                  {n.body && <span className="notif-text">{n.body}</span>}
                  <span className="notif-time">{timeAgo(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
