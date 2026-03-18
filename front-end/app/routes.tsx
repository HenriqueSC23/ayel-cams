import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { GuestOnlyRoute, ProtectedRoute } from './auth/route-guards';
import { MainLayout } from './layouts/main-layout';
import { ErrorPage } from './pages/error-page';

const HomePage = React.lazy(async () => {
  const module = await import('./pages/home');
  return { default: module.Home };
});

const AdminPage = React.lazy(async () => {
  const module = await import('./pages/admin');
  return { default: module.Admin };
});

const LoginPage = React.lazy(async () => {
  const module = await import('./pages/login');
  return { default: module.Login };
});

const AreaPage = React.lazy(async () => {
  const module = await import('./pages/area');
  return { default: module.Area };
});

const ProfilePage = React.lazy(async () => {
  const module = await import('./pages/profile');
  return { default: module.Profile };
});

const NotFoundPage = React.lazy(async () => {
  const module = await import('./pages/not-found-page');
  return { default: module.NotFoundPage };
});

function RouteLoadingFallback() {
  return <div className="min-h-[42vh] animate-pulse rounded-[24px] border border-[#dbe4ee] bg-white/80" />;
}

function SuspendedPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}

function HomeRoute() {
  return (
    <SuspendedPage>
      <HomePage />
    </SuspendedPage>
  );
}

function AreaRoute() {
  return (
    <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
      <SuspendedPage>
        <AreaPage />
      </SuspendedPage>
    </ProtectedRoute>
  );
}

function AdminRoute() {
  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <SuspendedPage>
        <AdminPage />
      </SuspendedPage>
    </ProtectedRoute>
  );
}

function ProfileRoute() {
  return (
    <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
      <SuspendedPage>
        <ProfilePage />
      </SuspendedPage>
    </ProtectedRoute>
  );
}

function LoginRoute() {
  return (
    <GuestOnlyRoute>
      <SuspendedPage>
        <LoginPage />
      </SuspendedPage>
    </GuestOnlyRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: HomeRoute },
      { path: 'area', Component: AreaRoute },
      { path: 'admin', Component: AdminRoute },
      { path: 'perfil', Component: ProfileRoute },
      {
        path: '*',
        Component: () => (
          <SuspendedPage>
            <NotFoundPage />
          </SuspendedPage>
        ),
      },
    ],
  },
  {
    path: '/login',
    Component: LoginRoute,
    errorElement: <ErrorPage />,
  },
]);
