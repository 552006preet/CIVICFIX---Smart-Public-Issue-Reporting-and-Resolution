import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Heart, Terminal } from 'lucide-react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>
              <Building2 size={22} color="#38bdf8" />
              CivicFix Platform
            </h3>
            <p>
              A transparent, citizen-powered platform for reporting and resolving municipal infrastructure issues in real time.
            </p>
            <div className="footer-badge">
              University Full Stack Development Capstone
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/complaints">Explore Complaints</Link></li>
              <li><Link to="/map">City Issue Map</Link></li>
              <li><Link to="/report">Report an Issue</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Issue Categories</h4>
            <ul className="footer-links">
              <li><span>Roads & Potholes</span></li>
              <li><span>Garbage & Waste</span></li>
              <li><span>Streetlights</span></li>
              <li><span>Water & Drainage</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Technology Stack</h4>
            <ul className="footer-links" style={{ fontSize: '13px', color: '#94a3b8' }}>
              <li>Python 3.14 + FastAPI</li>
              <li>PostgreSQL / SQLAlchemy ORM</li>
              <li>React 18 + Vite (Pure CSS)</li>
              <li>Leaflet & OpenStreetMap</li>
              <li>Automated Error Recovery System</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} CivicFix. Built for University FSD Evaluation & Demonstration.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Engineered with clean code & resilience</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
