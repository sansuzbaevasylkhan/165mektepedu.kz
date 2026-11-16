import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';
import Login from '../pages/Login';

/** Тіркелмеген пайдаланушыға жүйеге кіру беті көрсетіледі (URL өзгермейді). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!profile) return <Login gate />;
  return <>{children}</>;
}

/** Админ панелі: UI тексеру ыңғайлылық үшін ғана; нақты қорғаныс — сервердегі RLS/RPC. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!profile) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Директор панелі: тек director рөлі. Нақты қорғаныс — RLS (жазу тек director). */
export function RequireDirector({ children }: { children: ReactNode }) {
  const { profile, loading, isDirector } = useAuth();
  if (loading) return <Spinner />;
  if (!profile) return <Navigate to="/direktor-admin/login" replace />;
  if (!isDirector) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Кестені көру: ADMIN, DIRECTOR, TEACHER. Оқушы/ата-анаға жабық. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { profile, loading, isStaff } = useAuth();
  if (loading) return <Spinner />;
  if (!profile) return <Login gate />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}
