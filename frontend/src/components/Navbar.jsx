import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  PlusCircle, 
  ListFilter, 
  MapPin, 
  LayoutDashboard, 
  ShieldCheck, 
  Activity, 
  LogOut, 
  LogIn, 
  UserPlus 
} from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand">
          <div className="nav-logo-icon">
            <Building2 size={22} />
          </div>
          <div>
            CivicFix
            <span className="nav-brand-sub">Smart Public Reporting</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          
          <NavLink to="/complaints" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <ListFilter size={16} />
            Explore Complaints
          </NavLink>

          <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <MapPin size={16} />
            City Map
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <LayoutDashboard size={16} />
              {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin/health" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Activity size={16} />
              System Health
            </NavLink>
          )}
        </div>

        {/* Auth / Action Buttons */}
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <Link to="/report" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <PlusCircle size={16} />
                Report Issue
              </Link>

              <div className="user-badge">
                <span>{user?.full_name?.split(' ')[0]}</span>
                <span className="user-role-tag">{user?.role}</span>
              </div>

              <button onClick={handleLogout} className="btn btn-secondary" title="Log out" style={{ padding: '8px 12px' }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <LogIn size={15} />
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <UserPlus size={15} />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
