import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { phoneToEmail, toE164 } from './phone';
import type { Profile, Role } from './types';

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (digits: string, password: string, expected: 'student' | 'parent') => Promise<{ error?: string; role?: Role }>;
  signUp: (p: {
    digits: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'parent';
  }) => Promise<{ error?: string; loggedIn?: boolean }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const seenRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const p = (data as Profile | null) ?? null;
        if (p && !p.is_active) {
          supabase.auth.signOut();
          setProfile(null);
        } else {
          setProfile(p);
          if (p && seenRef.current !== userId) {
            seenRef.current = userId;
            supabase.rpc('touch_last_seen').then(() => undefined);
          }
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signIn: AuthCtx['signIn'] = useCallback(async (digits, password, expected) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(digits), password });
    if (error || !data.user) return { error: 'Телефон нөмірі немесе құпиясөз қате.' };
    const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const prof = p as Profile | null;
    if (!prof) {
      await supabase.auth.signOut();
      return { error: 'Профиль табылмады. Әкімшілікке хабарласыңыз.' };
    }
    if (!prof.is_active) {
      await supabase.auth.signOut();
      return { error: 'Бұл аккаунт өшірілген. Әкімшілікке хабарласыңыз.' };
    }
    if (prof.role !== 'admin' && prof.role !== expected) {
      await supabase.auth.signOut();
      return {
        error:
          prof.role === 'student'
            ? 'Бұл нөмір оқушы ретінде тіркелген. «Оқушы» батырмасын таңдаңыз.'
            : 'Бұл нөмір ата-ана ретінде тіркелген. «Ата-ана» батырмасын таңдаңыз.',
      };
    }
    return { role: prof.role };
  }, []);

  const signUp: AuthCtx['signUp'] = useCallback(async ({ digits, password, firstName, lastName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(digits),
      password,
      options: {
        data: { role, first_name: firstName.trim(), last_name: lastName.trim(), phone: toE164(digits) },
      },
    });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('already') || m.includes('registered')) return { error: 'Бұл телефон нөмірімен тіркеу бұрын жасалған.' };
      if (m.includes('password')) return { error: 'Құпиясөз тым қарапайым. Кемінде 8 таңба қолданыңыз.' };
      if (m.includes('database error')) return { error: 'Деректер дұрыс емес немесе нөмір бұрын тіркелген.' };
      return { error: error.message };
    }
    return { loggedIn: Boolean(data.session) };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signIn, signUp, signOut }),
    [user, profile, loading, signIn, signUp, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
