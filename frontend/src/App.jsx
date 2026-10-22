import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

import DashboardPage from './pages/Dashboard/DashboardPage';
import APIsOverviewPage from './pages/APIs/APIsOverviewPage';
import CollectionsPage from './pages/APIs/CollectionsPage';
import CollectionDetailsPage from './pages/APIs/CollectionDetailsPage';
import EndpointsPage from './pages/APIs/EndpointsPage';
import RequestPage from './pages/APIs/RequestPage';
import MockServersPage from './pages/MockServer/MockServersPage';
import MockServerDetailsPage from './pages/MockServer/MockServerDetailsPage';
import TestingOverviewPage from './pages/Testing/TestingOverviewPage';
import TestSuitesPage from './pages/Testing/TestSuitesPage';
import TestSuiteDetailsPage from './pages/Testing/TestSuiteDetailsPage';
import TestRunsPage from './pages/Testing/TestRunsPage';
import EnvironmentsPage from './pages/Environments/EnvironmentsPage';
import TrafficMonitoringPage from './pages/Monitoring/TrafficMonitoringPage';
import PerformanceMonitoringPage from './pages/Monitoring/PerformanceMonitoringPage';
import VersionsPage from './pages/Versions/VersionsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Index redirect to /dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* APIs routes */}
              <Route path="apis" element={<APIsOverviewPage />} />
              <Route path="apis/collections" element={<CollectionsPage />} />
              <Route path="apis/collections/:collectionId" element={<CollectionDetailsPage />} />
              <Route path="apis/endpoints" element={<EndpointsPage />} />
              <Route path="apis/request" element={<RequestPage />} />

              {/* Mock Servers */}
              <Route path="mock-servers" element={<MockServersPage />} />
              <Route path="mock-servers/:serverId" element={<MockServerDetailsPage />} />

              {/* Testing routes */}
              <Route path="testing" element={<TestingOverviewPage />} />
              <Route path="testing/suites" element={<TestSuitesPage />} />
              <Route path="testing/suites/:suiteId" element={<TestSuiteDetailsPage />} />
              <Route path="testing/runs" element={<TestRunsPage />} />

              {/* Environments */}
              <Route path="environments" element={<EnvironmentsPage />} />

              {/* Monitoring routes */}
              <Route path="monitoring/traffic" element={<TrafficMonitoringPage />} />
              <Route path="monitoring/performance" element={<PerformanceMonitoringPage />} />

              {/* Versions */}
              <Route path="versions" element={<VersionsPage />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />

              {/* Convenience Route Aliases */}
              <Route path="collections" element={<Navigate to="/apis/collections" replace />} />
              <Route path="collections/:collectionId" element={<CollectionDetailsPage />} />
              <Route path="endpoints" element={<Navigate to="/apis/endpoints" replace />} />
              <Route path="request" element={<Navigate to="/apis/request" replace />} />
              <Route path="traffic" element={<Navigate to="/monitoring/traffic" replace />} />
              <Route path="performance" element={<Navigate to="/monitoring/performance" replace />} />
              <Route path="suites" element={<Navigate to="/testing/suites" replace />} />
              <Route path="suites/:suiteId" element={<TestSuiteDetailsPage />} />
              <Route path="runs" element={<Navigate to="/testing/runs" replace />} />

              {/* Professional 404 Route for any unmatched paths */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
