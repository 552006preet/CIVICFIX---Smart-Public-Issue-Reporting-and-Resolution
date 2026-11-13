import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Check, Crosshair, AlertCircle } from 'lucide-react';

// Custom SVG Pin icon (no external image dependencies, guaranteed to render)
const customSvgPin = L.divIcon({
  className: 'custom-leaflet-svg-pin',
  html: `
    <div style="position: relative; width: 38px; height: 38px; transform: translate(-19px, -38px); cursor: grab;">
      <svg viewBox="0 0 24 24" width="38" height="38" fill="#e11d48" stroke="#ffffff" stroke-width="1.8" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -38],
});

// Component to handle map clicks and drag events
function LocationMarker({ position, setPosition }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPos = [Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))];
      setPosition(newPos);
      map.flyTo(newPos, map.getZoom() < 14 ? 15 : map.getZoom(), { duration: 0.6 });
    },
  });

  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          const newPos = [Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6))];
          setPosition(newPos);
        }
      },
    }),
    [setPosition]
  );

  return position ? (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customSvgPin}
    >
      <Popup autoPan={false}>
        <div style={{ textAlign: 'center', minWidth: '170px', padding: '4px' }}>
          <strong style={{ color: '#0f172a', fontSize: '13px' }}>📍 Issue Location Pin</strong>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: '600' }}>
            ✋ Drag this pin or click anywhere to adjust
          </div>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

// Controller component to smoothly fly to position when updated externally
function MapCenterController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, map.getZoom() < 14 ? 14 : map.getZoom(), { duration: 0.6 });
    }
  }, [position, map]);
  return null;
}

const PRESETS = [
  { name: '🎓 Chandigarh University', coords: [30.7699, 76.5759] },
  { name: '🏙️ Chandigarh Sec 17', coords: [30.7415, 76.7681] },
  { name: '📍 Mohali Phase 7', coords: [30.7046, 76.7179] },
  { name: '📍 New Delhi (CP)', coords: [28.6315, 77.2167] },
];

const MapPicker = ({ position, setPosition, height = '340px' }) => {
  const defaultCenter = position || [30.7699, 76.5759]; // Chandigarh University default

  const [latInput, setLatInput] = useState(position ? position[0].toString() : '30.7699');
  const [lngInput, setLngInput] = useState(position ? position[1].toString() : '76.5759');
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');

  // Keep manual inputs synced with position state
  useEffect(() => {
    if (position) {
      setLatInput(position[0].toFixed(6));
      setLngInput(position[1].toFixed(6));
    }
  }, [position]);

  const handleApplyInputs = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setPosition([lat, lng]);
      setGeoNotice('Pin coordinates updated!');
      setTimeout(() => setGeoNotice(''), 3000);
    } else {
      setGeoNotice('Invalid coordinates! Lat must be -90 to 90, Lng -180 to 180.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGeoNotice('Detecting your GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = [
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6)),
        ];
        setPosition(newPos);
        setLocating(false);
        setGeoNotice('✅ GPS location detected successfully!');
        setTimeout(() => setGeoNotice(''), 4000);
      },
      (err) => {
        setLocating(false);
        setGeoNotice('Could not get GPS location. Please allow browser location access or click on the map.');
        setTimeout(() => setGeoNotice(''), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Quick Location Shortcuts & GPS button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="btn"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <Crosshair size={14} />
          {locating ? 'Locating...' : '🎯 Detect My GPS Location'}
        </button>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Or quick jump to:</span>

        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setPosition(p.coords)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              cursor: 'pointer',
              color: '#334155',
              fontWeight: '500'
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Map Canvas */}
      <div style={{ height, width: '100%', position: 'relative', border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <MapCenterController position={position} />
        </MapContainer>

        {/* Floating Instruction Banner */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none'
          }}
        >
          <span>👉 Click anywhere on map or drag the red pin to mark issue</span>
        </div>
      </div>

      {geoNotice && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: geoNotice.startsWith('✅') ? '#059669' : '#e11d48', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={14} />
          {geoNotice}
        </div>
      )}

      {/* Precise Coordinate Inputs */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
          Exact Coordinates:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: '#64748b' }}>Lat:</label>
          <input
            type="text"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyInputs()}
            style={{ width: '95px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: '#64748b' }}>Lng:</label>
          <input
            type="text"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyInputs()}
            style={{ width: '95px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
        <button
          type="button"
          onClick={handleApplyInputs}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Set Coordinates
        </button>
      </div>
    </div>
  );
};

export default MapPicker;
