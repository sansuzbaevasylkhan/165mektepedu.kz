import { supabase } from '../../lib/supabase';

export async function uploadFile(bucket: string, file: File): Promise<{ path: string; url: string }> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path, url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}

export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    const u = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(u);
      resolve(Number.isFinite(v.duration) ? v.duration : 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(u);
      resolve(0);
    };
    v.src = u;
  });
}
