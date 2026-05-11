import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import api from './services/api';

// ─── Role-aware protected route ──────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// ─── Smart router: redirects based on role fetched from /auth/me ─────────────
const RoleRouter = () => {
  const [role, setRole] = useState(null);   // null = loading, 'admin' | 'student' = resolved
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setRole(res.data.role || 'student'))
      .catch(() => {
        localStorage.removeItem('token');
        setError(true);
      });
  }, []);

  if (error) return <Navigate to="/login" replace />;
  if (role === null) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: 'Inter, sans-serif' }}>
      Loading Campus Sphere...
    </div>
  );

  return role === 'admin' ? <AdminDashboard /> : <Dashboard />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleRouter />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>
);

export default App;
