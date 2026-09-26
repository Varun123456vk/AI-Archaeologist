import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { checkHealth } from './services/api';

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  const checkBackendHealth = useCallback(async () => {
    try {
      const result = await checkHealth();
      setBackendStatus(result.status === 'ok' ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            backendStatus={backendStatus}
            onAnalysisComplete={setAnalysisData}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <DashboardPage
            analysisData={analysisData}
            backendStatus={backendStatus}
            onNewAnalysis={() => setAnalysisData(null)}
          />
        }
      />
    </Routes>
  );
}
