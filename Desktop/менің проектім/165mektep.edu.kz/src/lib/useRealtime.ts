import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

interface Options {
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Supabase Realtime: көрсетілген кестелер өзгергенде onChange шақырылады.
 * RLS серверде қолданылады — пайдаланушыға көрінетін өзгерістер ғана келеді.
 * Тез келетін оқиғалар бір reload-қа біріктіріледі.
 */
export function useRealtime(tables: string[], onChange: () => void, opts: Options = {}) {
  const cb = useRef(onChange);
  cb.current = onChange;
  const { enabled = true, debounceMs = 300 } = opts;
  const key = tables.join(',');

  useEffect(() => {
    if (!enabled || !key) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = undefined; cb.current(); }, debounceMs);
    };

    const topic = `rt-${key.replace(/,/g, '-')}-${Math.random().toString(36).slice(2)}`;
    let channel = supabase.channel(topic);
    for (const table of key.split(',')) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, fire);
    }
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [key, enabled, debounceMs]);
}
