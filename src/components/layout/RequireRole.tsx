import React from 'react';
import { Navigate } from 'react-router-dom';
import { homePathFor, useCurrentUser, useSessionStore } from '@/store/useSessionStore';
import type { UserRole } from '@/types/directory';

/** Guardia de rutas privadas: sin sesión va a /inicio; con un rol sin acceso va a su propio inicio */
export const RequireRole: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const { role } = useCurrentUser();
  if (!isAuthenticated) return <Navigate to="/inicio" replace />;
  if (!roles.includes(role)) return <Navigate to={homePathFor(role)} replace />;
  return <>{children}</>;
};
