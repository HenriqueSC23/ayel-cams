import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth, type AuthRole } from './auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AuthRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-[#f4f7fb]" />;
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallbackRoute = role === 'administrador' ? '/admin' : '/area';
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

export function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-[#f4f7fb]" />;
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'administrador' ? '/admin' : '/area'} replace />;
  }

  return <>{children}</>;
}
