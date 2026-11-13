import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, ArrowRight, PlusCircle, Crosshair } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import '../styles/MapPage.css';

// SVG marker helper by status color
const getMarkerIcon = (status) => {
  let color = '#f59e0b'; // Pending: amber
  if (status === 'Resolved') color = '#10b981'; // Green
  else if (status === 'In Progress') color = '#3b82f6'; // Blue
  else if (status === 'Under Review') color = '#8b5cf6'; // Purple
  else if (status === 'Rejected') color = '#ef4444'; // Red

  return L.divIcon({
    className: 'custom-status-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; transform: translate(-16px, -32px); cursor: pointer;">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="#ffffff" stroke-width="1.8" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
};

// Newly marked pin on click
const newSpotPin = L.divIcon({
  className: 'custom-new-spot-pin',
  html: `
    <div style="position: relative; width: 38px; height: 38px; transform: translate(-19px, -38px); cursor: pointer;">
      <svg viewBox="0 0 24 24" width="38" height="38" fill="#e11d48" stroke="#ffffff" stroke-width="2" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -38],
});

// Listener component to handle clicking anywhere on the map to mark a new spot
function MapClickHandler({ markedSpot, setMarkedSpot }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      setMarkedSpot({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const CATEGORIES = [
  'All',
  'Roads & Potholes',
  'Garbage & Waste',
  'Streetlights',
  'Water Supply & Leakage',
  'Drainage & Sewage',
  'Public Property Damage',
  'Other',
];

const MapPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [markedSpot, setMarkedSpot] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints?limit=100');
        setComplaints(res.data.items || []);
      } catch (err) {
        console.error('Failed to load map data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filtered =
    category === 'All' ? complaints : complaints.filter((c) => c.category === category);

  const defaultCenter = [28.6139, 77.2090]; // Default New Delhi / North India center

  return (
    <div className="map-page">
      <div className="container">
        <div className="map-page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="map-page-title">City Issue Geographic Map</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Interactive map of all reported civic complaints. <strong>Click anywhere on the map</strong> to mark a location and report an issue!
              </p>
            </div>
            <Link to="/report" className="btn btn-primary">
              <PlusCircle size={16} />
              Report Issue
            </Link>
          </div>
        </div>

        <div className="map-wrapper">
          {/* Overlay Filter */}
          <div className="map-filter-overlay">
            <Filter size={15} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Filter Category:</span>
            <select
              style={{ padding: '4px 8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler markedSpot={markedSpot} setMarkedSpot={setMarkedSpot} />

            {/* Existing complaints markers */}
            {filtered.map((c) => (
              <Marker key={c.id} position={[c.latitude, c.longitude]} icon={getMarkerIcon(c.status)}>
                <Popup>
                  <div className="map-popup-card">
                    {c.image_url && (
                      <img
                        src={getImageUrl(c.image_url)}
                        alt={c.title}
                        className="popup-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    )}
                    <div style={{ marginBottom: '6px' }}>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="popup-title">#{c.id} {c.title}</div>
                    <div className="popup-category">{c.category}</div>
                    <p className="popup-desc">
                      {c.description.length > 80 ? `${c.description.substring(0, 80)}...` : c.description}
                    </p>
                    <Link
                      to={`/complaints/${c.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'var(--secondary)',
                      }}
                    >
                      View Full Details
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Newly marked pin on user click */}
            {markedSpot && (
              <Marker position={[markedSpot.lat, markedSpot.lng]} icon={newSpotPin}>
                <Popup autoPan={true}>
                  <div style={{ textAlign: 'center', padding: '6px', minWidth: '180px' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#e11d48', marginBottom: '2px' }}>
                      📍 Location Marked!
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                      {markedSpot.lat.toFixed(5)}, {markedSpot.lng.toFixed(5)}
                    </div>
                    <Link
                      to={`/report?lat=${markedSpot.lat.toFixed(6)}&lng=${markedSpot.lng.toFixed(6)}`}
                      className="btn btn-primary"
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <PlusCircle size={14} />
                      Report Issue Here
                    </Link>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Bottom Help Pill */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              zIndex: 1000,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }}
          >
            💡 Click anywhere on map to drop a pin and report an issue
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
