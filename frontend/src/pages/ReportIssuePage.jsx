import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Upload, 
  MapPin, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  CheckCircle,
  LogIn
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import '../styles/ReportIssue.css';

const CATEGORIES = [
  'Roads & Potholes',
  'Garbage & Waste',
  'Streetlights',
  'Water Supply & Leakage',
  'Drainage & Sewage',
  'Public Property Damage',
  'Other',
];

const ReportIssuePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(searchParams.get('address') || '');
  
  // Default map position: from URL params or Chandigarh University [30.7699, 76.5759]
  const paramLat = parseFloat(searchParams.get('lat'));
  const paramLng = parseFloat(searchParams.get('lng'));
  const initialPosition = (!isNaN(paramLat) && !isNaN(paramLng)) 
    ? [paramLat, paramLng] 
    : [30.7699, 76.5759];

  const [position, setPosition] = useState(initialPosition);

  // If query params change, update position
  useEffect(() => {
    if (!isNaN(paramLat) && !isNaN(paramLng)) {
      setPosition([paramLat, paramLng]);
    }
  }, [paramLat, paramLng]);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageWebUrl, setImageWebUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (maximum 5MB allowed).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let uploadedImageUrl = imageWebUrl.trim() || undefined;

      // 1. If user selected a file, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await api.post('/complaints/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedImageUrl = uploadRes.data.image_url;
      }

      // 2. Submit complaint
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        latitude: position[0],
        longitude: position[1],
        address: address.trim() || undefined,
        image_url: uploadedImageUrl,
      };

      const res = await api.post('/complaints', payload);
      setSuccess(`Complaint #${res.data.id} submitted successfully! Redirecting...`);
      setTimeout(() => {
        navigate(`/complaints/${res.data.id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="report-page">
        <div className="container report-container">
          <div className="report-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="dropzone-icon" style={{ backgroundColor: '#eff6ff' }}>
              <LogIn size={26} color="var(--secondary)" />
            </div>
            <h2 className="report-title">Citizen Login Required</h2>
            <p className="report-subtitle" style={{ maxWidth: '450px', margin: '0 auto 24px auto' }}>
              To ensure genuine civic reports and keep you informed of municipal progress, 
              please sign in or create an account before filing a complaint.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">
                Log In to CivicFix
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="container report-container">
        <div className="report-card">
          <div className="report-header">
            <h1 className="report-title">Report a Public Issue</h1>
            <p className="report-subtitle">
              Fill in the details below with photographs and location pin. Your report is directly visible to municipal teams.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label>Issue Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dangerous pothole near bus terminal entrance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Street Address / Landmark</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Opposite Metro Pillar 140, Outer Ring Rd"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                rows={4}
                className="form-control"
                placeholder="Describe the problem, severity, risks to pedestrians or vehicles, and how long the issue has persisted..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Image Upload Area */}
            <div className="form-group">
              <label>Photograph of the Problem (Optional but recommended)</label>
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <button type="button" onClick={handleRemoveImage} className="remove-image-btn">
                    <X size={14} style={{ marginRight: '4px' }} />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="image-dropzone">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                  />
                  <div className="dropzone-icon">
                    <Upload size={22} />
                  </div>
                  <div className="dropzone-text">Click to choose or drag & drop a photo</div>
                  <div className="dropzone-hint">PNG, JPG, or WEBP up to 5MB</div>
                </div>
              )}
            </div>

            {/* Interactive Location Picker Map */}
            <div className="form-group">
              <label>Pinpoint Location on Map *</label>
              <MapPicker position={position} setPosition={setPosition} height="280px" />
              <div className="coordinates-badge">
                <MapPin size={16} color="var(--secondary)" />
                <span>Selected Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              <PlusCircle size={18} />
              {submitting ? 'Submitting to Municipal Portal...' : 'Submit Civic Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssuePage;
