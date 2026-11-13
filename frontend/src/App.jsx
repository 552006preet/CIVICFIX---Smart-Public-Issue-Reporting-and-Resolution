import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import ReportIssuePage from './pages/ReportIssuePage';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MapPage from './pages/MapPage';
import SystemHealthPage from './pages/SystemHealthPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import './styles/global.css';

function NotFoundPage() {
  return (
    <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px' }}>404</h1>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home
      </Link>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
              <Route path="/report" element={<ReportIssuePage />} />
              <Route path="/map" element={<MapPage />} />
              
              {/* Dashboards */}
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/health" element={<SystemHealthPage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
