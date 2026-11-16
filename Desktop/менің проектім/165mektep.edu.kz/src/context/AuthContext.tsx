import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, phoneToEmail } from '../lib/supabase';
import { toE164 } from '../lib/phone';
import type { Profile } from '../types';

interface RegisterInput {
  role: 'student' | 'parent';
  firstName: string;
  lastName: string;
  phoneDigits: string;
  password: string;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isDirector: boolean;
  isTeacher: boolean;
  isStaff: boolean;
  signIn: (phoneDigits: string, password: string) => Promise<Profile>;
  signUp: (input: RegisterInput) => Promise<{ hasSession: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(uid: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    }).catch(() => alive && setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (!s) { setProfile(null); setLoading(false); }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    setLoading(true);
    fetchProfile(uid)
      .then(async (p) => {
        if (!alive) return;
        if (p?.is_blocked) {
          await supabase.auth.signOut();
          return;
        }
        setProfile(p);
      })
      .catch(() => { /* профиль жүктелмесе — қонақ күйінде қалады */ })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [uid]);

  // Белсенділік белгісі (admin dashboard "белсенді пайдаланушылар" үшін)
  useEffect(() => {
    if (!profile) return;
    const ping = () => {
      void supabase.rpc('touch_presence').then(undefined, () => { /* желі/конфиг қатесі — келесі пингте қайталанады */ });
    };
    ping();
    const id = window.setInterval(ping, 120000);
    return () => window.clearInterval(id);
  }, [profile]);

  const signIn = useCallback(async (digits: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(digits), password });
    if (error) throw error;
    const p = await fetchProfile(data.user.id);
    if (!p) { await supabase.auth.signOut(); throw new Error('Invalid login credentials'); }
    if (p.is_blocked) { await supabase.auth.signOut(); throw new Error('BLOCKED'); }
    setProfile(p);
    return p;
  }, []);

  const signUp = useCallback(async (i: RegisterInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(i.phoneDigits),
      password: i.password,
      options: {
        data: {
          role: i.role,
          first_name: i.firstName.trim(),
          last_name: i.lastName.trim(),
          phone: toE164(i.phoneDigits),
        },
      },
    });
    if (error) throw error;
    let hasSession = Boolean(data.session);
    if (!hasSession) {
      const r = await supabase.auth.signInWithPassword({ email: phoneToEmail(i.phoneDigits), password: i.password });
      hasSession = !r.error;
    }
    return { hasSession };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session, profile, loading,
      isAdmin: profile?.role === 'admin',
      isDirector: profile?.role === 'director',
      isTeacher: profile?.role === 'teacher',
      isStaff: profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'teacher',
      signIn, signUp, signOut,
    }),
    [session, profile, loading, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
