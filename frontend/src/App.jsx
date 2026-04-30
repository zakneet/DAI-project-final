import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// Lazy load — Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PatientDashboard = lazy(() => import('./components/Dashboard/PatientDashboard'));
const PatientQuestionnaire = lazy(() => import('./components/PreOp/PatientQuestionnaire'));
const AirwayEvaluation = lazy(() => import('./components/PreOp/AirwayEvaluation'));

// Lazy load — Doctor
const DoctorDashboard = lazy(() => import('./components/Dashboard/DoctorDashboard'));
const DoctorDashboardEnhanced = lazy(() => import('./components/Dashboard/DoctorDashboardEnhanced'));
const PreOpModule = lazy(() => import('./components/PreOp/PreOpModule'));

// Lazy load — IADE (Anesthesia)
const IADEDashboard = lazy(() => import('./components/Dashboard/IADEDashboard'));

// Lazy load — SSPI (Post-Op Recovery)
const SSPIDashboard = lazy(() => import('./components/Dashboard/SSPIDashboard'));

// Lazy load — Patient DPI
const PatientDPI = lazy(() => import('./pages/PatientDPI'));

import './App.css';

const Loader = () => (
  <div className="loader-container">
    <div className="loader"></div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" />;
};

const DoctorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'DOCTOR') return <Navigate to="/" />;
  return children;
};

const PatientRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'PATIENT') return <Navigate to="/" />;
  return children;
};

const IADERoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'IADE') return <Navigate to="/" />;
  return children;
};

const SSPIRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'SSPI') return <Navigate to="/" />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'DOCTOR') return <Navigate to="/doctor-dashboard" />;
  if (user.role === 'PATIENT') return <Navigate to="/patient-dashboard" />;
  if (user.role === 'IADE') return <Navigate to="/iade-dashboard" />;
  if (user.role === 'SSPI') return <Navigate to="/sspi-dashboard" />;
  return <Navigate to="/login" />;
};

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  // Landing page — full screen, no dashboard chrome
  if (isLandingPage) {
    return (
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="page-container">
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Root route — Landing Page is always the first page seen */}
              <Route path="/" element={<LandingPage />} />

              {/* Patient routes */}
              <Route path="/patient-dashboard" element={<PatientRoute><PatientDashboard /></PatientRoute>} />
              <Route path="/patient-dashboard/questionnaire" element={<PatientRoute><PatientQuestionnaire /></PatientRoute>} />
              <Route path="/patient-dashboard/airway" element={<PatientRoute><AirwayEvaluation /></PatientRoute>} />

              {/* Doctor routes */}
              <Route path="/doctor-dashboard" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
              <Route path="/doctor-dashboard/preop" element={<DoctorRoute><PreOpModule /></DoctorRoute>} />

              {/* IADE (Anesthesia) routes */}
              <Route path="/iade-dashboard" element={<IADERoute><IADEDashboard /></IADERoute>} />

              {/* SSPI (Post-Op Recovery) routes */}
              <Route path="/sspi-dashboard" element={<SSPIRoute><SSPIDashboard /></SSPIRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
