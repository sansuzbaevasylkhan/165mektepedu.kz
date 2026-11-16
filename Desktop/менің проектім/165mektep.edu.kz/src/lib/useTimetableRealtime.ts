import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/** `timetable` кестесі өзгергенде деректерді қайта жүктейді. Realtime RLS-ті өзі қолданады. */
export function useTimetableRealtime(reload: () => void) {
  const ref = useRef(reload);
  ref.current = reload;
  useEffect(() => {
    const topic = `timetable-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable' }, () => ref.current())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
}
