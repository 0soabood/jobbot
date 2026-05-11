import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/shared/AppShell';
import Landing from './pages/Landing';
import { useAuth } from './components/AuthProvider';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import ApplicationWorkspace from './pages/ApplicationWorkspace';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen bg-graphite-950 animate-pulse" />;
  }

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/jobs" element={user ? <Jobs /> : <Navigate to="/" />} />
          <Route path="/jobs/:id" element={user ? <JobDetail /> : <Navigate to="/" />} />
          <Route path="/applications" element={user ? <Applications /> : <Navigate to="/" />} />
          <Route path="/applications/:id" element={user ? <ApplicationWorkspace /> : <Navigate to="/" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
