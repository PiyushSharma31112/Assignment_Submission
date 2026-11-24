import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WorkspaceLayout from './layouts/WorkspaceLayout.jsx';
import LoadingState from './components/LoadingState.jsx';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Restoring your session..." />;
  return user ? <WorkspaceLayout /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { user, loading, error } = useAuth();
  if (loading) return <LoadingState label="Loading AssignHub..." />;
  return user ? <Navigate to="/workspace/dashboard" replace /> : <LoginPage serviceError={error} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicRoute />} />
          <Route path="/login" element={<PublicRoute />} />
          <Route path="/workspace/:page" element={<ProtectedRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
