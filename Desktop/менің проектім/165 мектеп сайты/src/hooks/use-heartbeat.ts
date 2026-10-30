import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useHeartbeat hook updates the user's last_seen_at timestamp in the profiles table.
 * It uses a Supabase RPC function 'update_last_seen' to perform the update efficiently.
 */
export function useHeartbeat() {
  useEffect(() => {
    const updateHeartbeat = async () => {
      try {
        // Call the RPC function defined in the migration
        const { error } = await supabase.rpc('update_last_seen');
        if (error) {
          console.error('Heartbeat update failed:', error.message);
        }
      } catch (err) {
        console.error('Heartbeat unexpected error:', err);
      }
    };

    // Initial update on mount
    updateHeartbeat();

    // Update every 3 minutes (180,000 ms)
    const interval = setInterval(updateHeartbeat, 180000);

    return () => clearInterval(interval);
  }, []);
}
