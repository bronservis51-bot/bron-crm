import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHashRouter, Navigate, RouterProvider, useRouteError } from 'react-router';
import { SessionProvider, useSession } from '../platform/session';
import { isConfigured } from '../platform/config';
import { toAppError } from '../platform/backend';
import { LeadsPage } from '../modules/leads/LeadsPage';
import { ToastProvider } from '../ui/toast';
import { Button, ErrorState } from '../ui';
import { LoginPage, SetupPage } from './LoginPage';
import { Shell } from './Shell';

const qc = new QueryClient({ defaultOptions: { queries: {
  staleTime: 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: true,
  retry: (count, e) => count < 2 && !['forbidden', 'unauthenticated', 'validation', 'not-found'].includes(toAppError(e).code),
} } });

function RouteError() {
  const error = useRouteError();
  return <div className="content"><ErrorState error={error} onRetry={() => location.reload()} /></div>;
}

function Guard() {
  const { status, isManager, signOut } = useSession();
  if (status === 'loading') return <div className="boot-screen" role="status" aria-label="Загрузка"><img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" /><div className="boot-bar"><span /></div><a href={`${import.meta.env.BASE_URL}help.html`}>Помощь при сбое</a></div>;
  if (status === 'signed-out') return <Navigate to="/login" replace />;
  if (!isManager) return <div className="content"><h1>Нет доступа к заявкам</h1><p>Нужна действующая учётная запись с доступом к заявкам основного приложения.</p><Button onClick={() => void signOut()}>Выйти</Button></div>;
  return <Shell />;
}

const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Guard />, errorElement: <RouteError />, children: [
    { index: true, element: <LeadsPage /> },
    { path: 'leads', element: <LeadsPage /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ] },
]);

export function App() {
  if (!isConfigured) return <SetupPage />;
  return <QueryClientProvider client={qc}><SessionProvider><ToastProvider><RouterProvider router={router} /></ToastProvider></SessionProvider></QueryClientProvider>;
}
