import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="p-8 text-center text-gray-500">Carregando…</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
