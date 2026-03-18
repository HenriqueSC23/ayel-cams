import React from 'react';
import { createBrowserRouter } from 'react-router';
import { GuestOnlyRoute, ProtectedRoute } from './auth/route-guards';
import { MainLayout } from './layouts/main-layout';
import { Home } from './pages/home';
import { Admin } from './pages/admin';
import { Login } from './pages/login';
import { Area } from './pages/area';
import { Profile } from './pages/profile';
import { ErrorPage } from './pages/error-page';
import { NotFoundPage } from './pages/not-found-page';

function AreaRoute() {
  return (
    <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
      <Area />
    </ProtectedRoute>
  );
}

function AdminRoute() {
  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <Admin />
    </ProtectedRoute>
  );
}

function ProfileRoute() {
  return (
    <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
      <Profile />
    </ProtectedRoute>
  );
}

function LoginRoute() {
  return (
    <GuestOnlyRoute>
      <Login />
    </GuestOnlyRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: Home },
      { path: 'area', Component: AreaRoute },
      { path: 'admin', Component: AdminRoute },
      { path: 'perfil', Component: ProfileRoute },
      { path: '*', Component: NotFoundPage },
    ],
  },
  {
    path: '/login',
    Component: LoginRoute,
    errorElement: <ErrorPage />,
  },
]);
