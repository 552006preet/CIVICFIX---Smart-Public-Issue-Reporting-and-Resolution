import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Clock, 
  Wrench, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  ExternalLink,
  ThumbsUp,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';

const CitizenDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/citizen');
        setDashboardData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load citizen dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading your citizen portal...</p>
      </div>
    );
  }

  const { total_complaints, pending, in_progress, resolved, rejected, recent_complaints } =
    dashboardData || {
      total_complaints: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      recent_complaints: [],
    };

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {user?.full_name}</h1>
            <p className="dashboard-subtitle">
              Track the progress and remediation of all civic complaints submitted by you.
            </p>
          </div>
          <Link to="/report" className="btn btn-primary">
            <PlusCircle size={16} />
            Report New Issue
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">My Total Reports</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Building2 size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{total_complaints}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Awaiting Review</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{pending}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Under Remediation</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                <Wrench size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{in_progress}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Successfully Resolved</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{resolved}</div>
          </div>
        </div>

        {/* My Reports Table */}
        <div className="table-card">
          <div className="table-header">
            <h2 className="table-title">My Filed Complaints History</h2>
            <Link to="/complaints" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Explore City Issues
            </Link>
          </div>

          {recent_complaints.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '16px' }}>You haven't submitted any civic complaints yet.</p>
              <Link to="/report" className="btn btn-primary">
                <PlusCircle size={16} />
                Submit Your First Issue
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Issue Title</th>
                    <th>Category</th>
                    <th>Date Reported</th>
                    <th>Upvotes</th>
                    <th>Current Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_complaints.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-light)' }}>#{c.id}</td>
                      <td>
                        <div className="table-complaint-title">
                          <Link to={`/complaints/${c.id}`}>{c.title}</Link>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={12} />
                          {c.address || `${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)}`}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
                          {c.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                          <ThumbsUp size={13} color="var(--secondary)" />
                          {c.upvotes_count}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        <Link to={`/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                          Track Progress
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
