import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  PlusCircle, 
  ListFilter, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Users, 
  Camera, 
  MapPin, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import '../styles/HomePage.css';

const HomePage = () => {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/complaints?limit=3&sort_by=newest');
        const items = res.data.items || [];
        setRecentComplaints(items);

        // Fetch city statistics
        const allRes = await api.get('/complaints?limit=100');
        const allItems = allRes.data.items || [];
        const total = allRes.data.total || allItems.length;
        const resolved = allItems.filter((c) => c.status === 'Resolved').length;
        const inProgress = allItems.filter((c) => c.status === 'In Progress' || c.status === 'Under Review').length;
        const pending = allItems.filter((c) => c.status === 'Pending').length;

        setStats({ total, resolved, inProgress, pending });
      } catch (err) {
        console.error('Failed to load home data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">
              <ShieldAlert size={16} />
              Empowering Citizens, Enabling Municipalities
            </div>

            <h1 className="hero-title">
              Report Public Issues. <br />
              <span>Track Resolution in Real Time.</span>
            </h1>

            <p className="hero-desc">
              CivicFix bridges the gap between citizens and local government. 
              Report potholes, broken streetlights, water leaks, and waste accumulation with photographs 
              and map locations directly to municipal authorities.
            </p>

            <div className="hero-buttons">
              <Link to="/report" className="btn btn-hero-primary">
                <PlusCircle size={18} />
                Report an Issue
              </Link>
              <Link to="/complaints" className="btn btn-hero-secondary">
                <ListFilter size={18} />
                Explore Complaints
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Counters */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Building2 size={26} />
              </div>
              <div>
                <div className="stat-num">{stats.total}</div>
                <div className="stat-label">Total Issues Reported</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div className="stat-num">{stats.resolved}</div>
                <div className="stat-label">Issues Resolved</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                <Wrench size={26} />
              </div>
              <div>
                <div className="stat-num">{stats.inProgress}</div>
                <div className="stat-label">Under Active Work</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                <Clock size={26} />
              </div>
              <div>
                <div className="stat-num">{stats.pending}</div>
                <div className="stat-label">Awaiting Municipal Review</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple & Transparent</span>
            <h2 className="section-title">How CivicFix Works</h2>
            <p className="section-subtitle">
              From report to resolution, every step is transparent and visible to the community.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">Step 01</span>
              <h3>Snap & Pinpoint</h3>
              <p>
                Take a photograph of the damaged road, overflowing garbage, or streetlight failure. 
                Our interactive map automatically records the exact GPS coordinates.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">Step 02</span>
              <h3>Community Upvotes</h3>
              <p>
                Neighbors and citizens can upvote reported issues. 
                Complaints with higher support gain higher visibility for municipal prioritization.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">Step 03</span>
              <h3>Municipal Resolution</h3>
              <p>
                City engineers and sanitation departments update progress milestones 
                (Under Review &rarr; In Progress &rarr; Resolved) with official verification photos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Reported Complaints */}
      <section className="section">
        <div className="container">
          <div className="recent-header">
            <div>
              <span className="section-tag">Live Activity</span>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Recently Reported Complaints</h2>
            </div>
            <Link to="/complaints" className="btn btn-outline">
              View All Complaints
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading recent public complaints...</p>
          ) : recentComplaints.length === 0 ? (
            <div className="alert alert-info">No complaints reported yet. Be the first citizen to report an issue!</div>
          ) : (
            <div className="recent-grid">
              {recentComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
