import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/hooks/useTheme';
import AppShell from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui';

const Dashboard    = lazy(() => import('@/features/dashboard/DashboardPage'));
const MapPage      = lazy(() => import('@/features/map/MapPage'));
const SensorsPage  = lazy(() => import('@/features/sensors/SensorsPage'));
const IncidentsPage = lazy(() => import('@/features/incidents/IncidentsPage'));
const ScenarioLab  = lazy(() => import('@/features/scenario-lab/ScenarioLabPage'));
const DecisionDelta = lazy(() => import('@/features/decision-delta/DecisionDeltaPage'));
const EvidencePage = lazy(() => import('@/features/evidence/EvidencePage'));
const SocPage      = lazy(() => import('@/features/soc/SocPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 2,
    },
  },
});

function PageLoader() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skeleton height={32} width={300} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} />)}
      </div>
      <Skeleton height={320} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"      element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="map"            element={<Suspense fallback={<PageLoader />}><MapPage /></Suspense>} />
              <Route path="sensors"        element={<Suspense fallback={<PageLoader />}><SensorsPage /></Suspense>} />
              <Route path="incidents"      element={<Suspense fallback={<PageLoader />}><IncidentsPage /></Suspense>} />
              <Route path="scenario-lab"   element={<Suspense fallback={<PageLoader />}><ScenarioLab /></Suspense>} />
              <Route path="decision-delta" element={<Suspense fallback={<PageLoader />}><DecisionDelta /></Suspense>} />
              <Route path="evidence"       element={<Suspense fallback={<PageLoader />}><EvidencePage /></Suspense>} />
              <Route path="soc"            element={<Suspense fallback={<PageLoader />}><SocPage /></Suspense>} />
              <Route path="settings"       element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
              <Route path="*"              element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              boxShadow: 'var(--shadow-raised)',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
