import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anon && !url.includes('YOUR-PROJECT'));

export const SUPABASE_URL = isConfigured ? (url as string) : 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY = isConfigured ? (anon as string) : 'placeholder-anon-key';

// Тек anon (public) кілті. service_role кілті frontend-те ЕШҚАШАН қолданылмайды.
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export const PHONE_EMAIL_DOMAIN = 'phone.165mektep.edu.kz';
export const phoneToEmail = (digits: string) => `7${digits}@${PHONE_EMAIL_DOMAIN}`;
