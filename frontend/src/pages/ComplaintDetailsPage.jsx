import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  User, 
  ThumbsUp, 
  Tag, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Trash2, 
  ArrowLeft,
  Share2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api, { getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import '../styles/ComplaintDetails.css';

// Ensure Leaflet marker default icon works
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upvote state
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [voting, setVoting] = useState(false);

  // Admin status update state
  const [newStatus, setNewStatus] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
      setUpvotes(res.data.upvotes_count);
      setHasUpvoted(res.data.has_upvoted);
      setNewStatus(res.data.status);
      setResolutionNotes(res.data.resolution_notes || '');
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleVoteToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (voting) return;
    setVoting(true);

    try {
      const res = await api.post(`/complaints/${id}/vote`);
      setUpvotes(res.data.upvotes_count);
      setHasUpvoted(res.data.has_upvoted);
    } catch (err) {
      alert(err.message || 'Failed to update vote.');
    } finally {
      setVoting(false);
    }
  };

  const handleAdminStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    setStatusSuccess('');

    try {
      const payload = {
        status: newStatus,
        comment: adminComment || undefined,
        resolution_notes: newStatus === 'Resolved' ? resolutionNotes : undefined,
      };

      const res = await api.put(`/complaints/${id}/status`, payload);
      setComplaint(res.data);
      setStatusSuccess(`Complaint status updated to "${res.data.status}" successfully!`);
      setAdminComment('');
    } catch (err) {
      alert(err.message || 'Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/complaints/${id}`);
      navigate('/complaints');
    } catch (err) {
      alert(err.message || 'Failed to delete complaint.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading complaint information...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="container" style={{ padding: '60px 20px' }}>
        <div className="alert alert-error">{error || 'Complaint not found.'}</div>
        <Link to="/complaints" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to All Complaints
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(complaint.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="details-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="details-breadcrumb">
          <Link to="/complaints">Explore Complaints</Link>
          <span>/</span>
          <span>Complaint #{complaint.id}</span>
        </div>

        <div className="details-grid">
          {/* Main Column */}
          <div className="details-main">
            <div className="details-card">
              <div className="details-header">
                <div>
                  <h1 className="details-title">{complaint.title}</h1>
                  <div className="details-meta-bar">
                    <div className="details-meta-item">
                      <Tag size={14} color="var(--secondary)" />
                      <span>{complaint.category}</span>
                    </div>
                    <div className="details-meta-item">
                      <Calendar size={14} />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="details-meta-item">
                      <User size={14} />
                      <span>Reported by {complaint.author_name}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={complaint.status} />
              </div>

              {/* Issue Photograph */}
              {complaint.image_url && (
                <div className="details-image-container">
                  <img
                    src={getImageUrl(complaint.image_url)}
                    alt={complaint.title}
                    className="details-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              )}

              {/* Description */}
              <h2 className="details-description-title">Issue Description</h2>
              <p className="details-description-text">{complaint.description}</p>

              {/* Resolution Box if resolved */}
              {complaint.status === 'Resolved' && (
                <div className="resolution-box">
                  <div className="resolution-box-title">
                    <CheckCircle size={20} />
                    Issue Resolved by Municipal Authorities
                  </div>
                  <p>
                    {complaint.resolution_notes || 'Municipal teams completed remediation and closed this report.'}
                  </p>
                  {complaint.resolution_image_url && (
                    <img
                      src={getImageUrl(complaint.resolution_image_url)}
                      alt="Resolution verification"
                      className="resolution-image"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Status History / Timeline Card */}
            <div className="details-card">
              <h2 className="details-description-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--primary)" />
                Complaint Progress & Status History
              </h2>

              {complaint.status_history && complaint.status_history.length > 0 ? (
                <div className="timeline">
                  {complaint.status_history.map((hist) => (
                    <div key={hist.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-header">
                        <span className="timeline-status">{hist.new_status}</span>
                        <span className="timeline-date">
                          {new Date(hist.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="timeline-comment">{hist.comment}</p>
                      <div className="timeline-author">Updated by {hist.changed_by_name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px' }}>
                  No previous status changes recorded.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="details-sidebar">
            {/* Community Support Box */}
            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <ThumbsUp size={18} />
                Community Support
              </h3>
              <div className="vote-action-box">
                <div>
                  <div className="vote-count-big">{upvotes}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Citizens upvoted this issue</div>
                </div>
                <button
                  onClick={handleVoteToggle}
                  className={`btn ${hasUpvoted ? 'btn-primary' : 'btn-outline'}`}
                  disabled={voting}
                >
                  <ThumbsUp size={16} />
                  {hasUpvoted ? 'Upvoted' : 'Upvote'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                High upvote counts notify the municipal maintenance directorate to expedite inspection and remediation.
              </p>
            </div>

            {/* Location & Map Card */}
            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <MapPin size={18} />
                Location & Coordinates
              </h3>

              <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '14px', fontWeight: '500' }}>
                {complaint.address || 'Address coordinates available on map below'}
              </div>

              <div style={{ height: '220px', width: '100%', marginBottom: '10px' }}>
                <MapContainer
                  center={[complaint.latitude, complaint.longitude]}
                  zoom={14}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[complaint.latitude, complaint.longitude]}>
                    <Popup>{complaint.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                GPS: {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
              </div>
            </div>

            {/* Municipal Admin Action Panel (Visible to Admins) */}
            {isAdmin && (
              <div className="sidebar-card" style={{ border: '2px solid #bfdbfe', backgroundColor: '#f8fafc' }}>
                <h3 className="sidebar-title" style={{ color: '#1e40af' }}>
                  <ShieldCheck size={18} />
                  Municipal Admin Controls
                </h3>

                {statusSuccess && <div className="alert alert-success" style={{ fontSize: '12px' }}>{statusSuccess}</div>}

                <form onSubmit={handleAdminStatusSubmit} className="admin-status-form">
                  <div className="form-group">
                    <label>Update Status</label>
                    <select
                      className="form-control"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department Note / Action Taken</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="e.g. Dispatched asphalt repair truck #04."
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                    />
                  </div>

                  {newStatus === 'Resolved' && (
                    <div className="form-group">
                      <label>Resolution Summary</label>
                      <textarea
                        rows={2}
                        className="form-control"
                        placeholder="Explain how the issue was fixed..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                      />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={updatingStatus}>
                    {updatingStatus ? 'Updating...' : 'Save Status Update'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteComplaint}
                    className="btn btn-danger"
                    style={{ marginTop: '10px' }}
                  >
                    <Trash2 size={15} />
                    Delete Spam Complaint
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailsPage;
