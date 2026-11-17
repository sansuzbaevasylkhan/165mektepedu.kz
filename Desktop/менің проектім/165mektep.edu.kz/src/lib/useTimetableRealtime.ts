import { useRealtime } from './useRealtime';

/** `timetable`/`timetable_history` өзгергенде деректерді қайта жүктейді. Realtime RLS-ті өзі қолданады. */
export function useTimetableRealtime(reload: () => void) {
  useRealtime(['timetable', 'timetable_history'], reload);
}
