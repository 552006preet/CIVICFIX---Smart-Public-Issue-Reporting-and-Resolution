import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Clock, 
  Eye, 
  Wrench, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Search
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/admin');
      setDashboardData(res.data);
      setComplaints(res.data.recent_complaints || []);
    } catch (err) {
      setError(err.message || 'Failed to load administrator dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, isAdmin]);

  const handleQuickStatusChange = async (complaintId, newStatus) => {
    try {
      const res = await api.put(`/complaints/${complaintId}/status`, {
        status: newStatus,
        comment: `Status modified to ${newStatus} via Administrator Quick Controls.`,
      });

      // Update state locally
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: res.data.status } : c))
      );
      // Refresh counts
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteSpam = async (complaintId) => {
    if (!window.confirm(`Delete complaint #${complaintId}? This will remove it from public view.`)) {
      return;
    }

    try {
      await api.delete(`/complaints/${complaintId}`);
      setComplaints((prev) => prev.filter((c) => c.id !== complaintId));
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete complaint.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading municipal administration console...</p>
      </div>
    );
  }

  const {
    total_complaints = 0,
    pending = 0,
    under_review = 0,
    in_progress = 0,
    resolved = 0,
    rejected = 0,
    category_breakdown = [],
  } = dashboardData || {};

  const filteredComplaints = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={28} color="var(--primary)" />
              Municipal Command Center
            </h1>
            <p className="dashboard-subtitle">
              Centralized municipal management: oversee public reports, update remediation milestones, and monitor system health.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/admin/health" className="btn btn-secondary">
              <Activity size={16} />
              System Diagnostics
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* City-Wide Metrics */}
        <div className="dashboard-stats-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Total City Reports</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Building2 size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{total_complaints}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Pending Review</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{pending}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Under Inspection</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
                <Eye size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{under_review}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Active Work</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                <Wrench size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{in_progress}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Resolved Issues</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{resolved}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">Rejected / Invalid</span>
              <div className="dash-stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <XCircle size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{rejected}</div>
          </div>
        </div>

        {/* Category Breakdown Bar Cards */}
        {category_breakdown.length > 0 && (
          <div className="category-bars-card">
            <h3 className="category-bars-title">Complaint Distribution by Infrastructure Category</h3>
            <div className="category-bars-grid">
              {category_breakdown.map((cat) => (
                <div key={cat.category} className="cat-bar-item">
                  <span className="cat-bar-name">{cat.category}</span>
                  <span className="cat-bar-count">{cat.count} issues</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage Complaints Table */}
        <div className="table-card">
          <div className="table-header">
            <h2 className="table-title">Manage Reported Complaints</h2>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Filter table..."
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-light)' }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title & Location</th>
                  <th>Category</th>
                  <th>Reported By</th>
                  <th>Upvotes</th>
                  <th>Current Status</th>
                  <th>Quick Status Action</th>
                  <th>Spam Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '700', color: 'var(--text-light)' }}>#{c.id}</td>
                    <td>
                      <div className="table-complaint-title">
                        <Link to={`/complaints/${c.id}`}>{c.title}</Link>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {c.address || `${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)}`}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.category}</span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{c.author_name}</td>
                    <td style={{ fontWeight: '700' }}>{c.upvotes_count}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <select
                        className="quick-status-select"
                        value={c.status}
                        onChange={(e) => handleQuickStatusChange(c.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteSpam(c.id)}
                        className="btn-icon-danger"
                        title="Delete spam/inappropriate report"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
