import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Spinner } from './ui';
import type { Role } from '../lib/types';

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user || !profile) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ЕСКЕРТУ: бұл тек интерфейсті жасыру. Нақты рұқсатты Supabase RLS / RPC сервер жағында тексереді.
export function RequireAdmin({ children }: { children: ReactNode }) {
  return <RequireAuth roles={['admin']}>{children}</RequireAuth>;
}
