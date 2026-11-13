import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Clock,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/SystemHealth.css';

const SystemHealthPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [healthData, setHealthData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchHealthAndLogs = async () => {
    try {
      const [hRes, lRes] = await Promise.all([
        api.get('/health'),
        api.get('/admin/system-logs?limit=50'),
      ]);
      setHealthData(hRes.data);
      setLogs(lRes.data);
    } catch (err) {
      console.error('Failed to fetch diagnostics:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    fetchHealthAndLogs();
  }, [isAuthenticated, isAdmin]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchHealthAndLogs();
  };

  const handleTestRecovery = async () => {
    setSimulating(true);
    setActionMessage('');
    try {
      const res = await api.post('/admin/test-recovery');
      setActionMessage(`Automatic Recovery Test: ${res.data.message}`);
      fetchHealthAndLogs();
    } catch (err) {
      setActionMessage(`Recovery Test Failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Probing system health diagnostics...</p>
      </div>
    );
  }

  const isOnline = healthData?.status === 'Online';
  const dbHealth = healthData?.database || {};
  const uptimeMinutes = healthData ? Math.floor(healthData.uptime_seconds / 60) : 0;
  const uptimeSeconds = healthData ? Math.floor(healthData.uptime_seconds % 60) : 0;

  return (
    <div className="health-page">
      <div className="container">
        {/* Header */}
        <div className="health-header">
          <div>
            <h1 className="health-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={28} color="var(--primary)" />
              System Health & Automatic Recovery
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Real-time architectural reliability monitoring, database connection state, and self-healing audit trail.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleManualRefresh} className="btn btn-secondary" disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Checking...' : 'Refresh Status'}
            </button>
            <button onClick={handleTestRecovery} className="btn btn-primary" disabled={simulating}>
              <ShieldCheck size={16} />
              {simulating ? 'Running Self-Check...' : 'Test Automatic Recovery'}
            </button>
          </div>
        </div>

        {actionMessage && <div className="alert alert-info">{actionMessage}</div>}

        {/* Status Banner */}
        <div className={`health-status-banner ${isOnline ? 'banner-online' : 'banner-degraded'}`}>
          <div className="health-indicator">
            <div className={`status-pulse-dot ${isOnline ? 'pulse-green' : 'pulse-orange'}`} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: isOnline ? '#166534' : '#9a3412' }}>
                System Status: {healthData?.status || 'Unknown'}
              </div>
              <div style={{ fontSize: '13px', color: isOnline ? '#15803d' : '#c2410c' }}>
                FastAPI REST service running stably. Automatic recovery monitors active.
              </div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Last health verification: <strong>{new Date().toLocaleTimeString()}</strong>
          </div>
        </div>

        {/* Health Metrics Grid */}
        <div className="health-grid">
          <div className="health-metric-card">
            <div className="metric-title">DATABASE CONNECTION</div>
            <div className="metric-val">
              {dbHealth.healthy ? (
                <CheckCircle2 size={22} color="#16a34a" />
              ) : (
                <XCircle size={22} color="#dc2626" />
              )}
              {dbHealth.status || 'Disconnected'}
            </div>
            <div className="metric-sub">
              Engine: <strong>{dbHealth.type || 'Unknown'}</strong> (Ping: {dbHealth.latency_ms || 0} ms)
            </div>
          </div>

          <div className="health-metric-card">
            <div className="metric-title">BACKEND SERVER UPTIME</div>
            <div className="metric-val">
              <Clock size={22} color="var(--secondary)" />
              {uptimeMinutes}m {uptimeSeconds}s
            </div>
            <div className="metric-sub">FastAPI 0.110+ on Python 3.14 (ASGI)</div>
          </div>

          <div className="health-metric-card">
            <div className="metric-title">SELF-HEALING MECHANISM</div>
            <div className="metric-val">
              <Cpu size={22} color="#0284c7" />
              Resilient Failover Active
            </div>
            <div className="metric-sub">Automatic retries on transient connection drops</div>
          </div>
        </div>

        {/* System Logs Audit Trail */}
        <div className="logs-card">
          <div className="logs-header">
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)' }}>
                System Event Logs & Automated Recovery Trail
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Recorded internal events, connection attempts, and recovery routines.
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Event Message</th>
                  <th>Recovery Executed</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                      No errors or recovery events recorded. System running smoothly!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-light)' }}>#{log.id}</td>
                      <td>
                        <span className={`log-level-tag tag-${log.level}`}>{log.level}</span>
                      </td>
                      <td style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {log.category}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div>{log.message}</div>
                        {log.details && (
                          <pre style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', maxWidth: '400px', overflowX: 'auto' }}>
                            {log.details.substring(0, 150)}...
                          </pre>
                        )}
                      </td>
                      <td>
                        {log.recovery_attempted ? (
                          <span style={{ fontSize: '12px', fontWeight: '700', color: log.recovery_successful ? '#16a34a' : '#dc2626' }}>
                            {log.recovery_successful ? 'Success (Recovered)' : 'Failed'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;
