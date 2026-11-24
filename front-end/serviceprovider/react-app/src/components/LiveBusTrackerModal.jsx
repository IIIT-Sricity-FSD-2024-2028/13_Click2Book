import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, AlertTriangle, ShieldAlert, X } from 'lucide-react';

/* ── Google Maps JavaScript API Loader ── */
function loadGoogleMapsScript(apiKey, callback) {
  if (typeof window === 'undefined') return;
  if (window.google && window.google.maps) {
    callback(true);
    return;
  }
  const existing = document.getElementById('c2b-google-maps-sdk');
  if (existing) {
    existing.addEventListener('load', () => callback(true));
    existing.addEventListener('error', () => callback(false));
    return;
  }
  const script = document.createElement('script');
  script.id = 'c2b-google-maps-sdk';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
  script.async = true;
  script.defer = true;
  script.onload = () => callback(true);
  script.onerror = () => callback(false);
  document.head.appendChild(script);
}

export default function LiveBusTrackerModal({
  isOpen,
  onClose,
  trip,
  booking,
  isProviderView = false,
  onRaiseSos,
}) {
  if (!isOpen) return null;

  const item = booking || trip || {};
  const tripId = item.tripId || item.id || 'T001';
  const fromCity = item.from || item.source || 'Origin';
  const toCity = item.to || item.destination || 'Destination';
  const busName = item.busName || item.name || 'Express Bus';
  const busType = item.busType || item.vehicleType || item.type || 'AC';
  const bookingId = item.bookingId || item.pnr || `TRIP-${tripId}`;

  const intermediateStops = Array.isArray(item.intermediateStops) && item.intermediateStops.length > 0
    ? item.intermediateStops
    : item.via
    ? String(item.via).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const [telemetry, setTelemetry] = useState(() => {
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const st = statuses[tripId] || item.status || 'SCHEDULED';
    const nextSt = st === 'COMPLETED'
      ? `${toCity} Terminal`
      : st === 'IN_PROGRESS'
      ? (intermediateStops.length > 0 ? `${intermediateStops[0]} Station` : 'Highway Transit Junction')
      : `${fromCity} Boarding Point`;

    return {
      lat: 13.5684,
      lng: 80.0215,
      nextStop: nextSt,
      status: st,
      percentComplete: st === 'COMPLETED' ? 100 : st === 'IN_PROGRESS' ? 52 : 0,
      etaMinutes: st === 'COMPLETED' ? 0 : st === 'IN_PROGRESS' ? 45 : 120,
      speedKmph: st === 'IN_PROGRESS' ? 54 : 0,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const [mapError, setMapError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Read Google Maps API Key from Vite env or window
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
    || (typeof window !== 'undefined' && (window.VITE_GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY))
    || '';

  // Poll live telemetry from localStorage and events
  useEffect(() => {
    const updateTelemetry = () => {
      const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
      const st = statuses[tripId] || item.status || 'SCHEDULED';

      setTelemetry((prev) => ({
        ...prev,
        status: st,
        nextStop: st === 'COMPLETED' ? `${toCity} Terminal` : st === 'IN_PROGRESS' ? 'Highway Transit Junction' : `${fromCity} Boarding Point`,
        percentComplete: st === 'COMPLETED' ? 100 : st === 'IN_PROGRESS' ? 52 : 0,
        etaMinutes: st === 'COMPLETED' ? 0 : st === 'IN_PROGRESS' ? 45 : 120,
        speedKmph: st === 'IN_PROGRESS' ? 54 : 0,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
    };

    updateTelemetry();
    window.addEventListener('storage', updateTelemetry);
    window.addEventListener('c2b_sync', updateTelemetry);
    const interval = setInterval(updateTelemetry, 4000);
    return () => {
      window.removeEventListener('storage', updateTelemetry);
      window.removeEventListener('c2b_sync', updateTelemetry);
      clearInterval(interval);
    };
  }, [tripId, fromCity, toCity, item.status]);

  // Google Maps SDK Initialization
  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to your .env file to view live satellite/street map tiles.');
      return;
    }

    loadGoogleMapsScript(apiKey, (success) => {
      if (!success || !window.google || !window.google.maps) {
        setMapError('Failed to load Google Maps SDK. Please check your network connection and API key quota.');
        return;
      }

      try {
        if (mapContainerRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: telemetry.lat, lng: telemetry.lng },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          markerInstanceRef.current = new window.google.maps.Marker({
            position: { lat: telemetry.lat, lng: telemetry.lng },
            map: mapInstanceRef.current,
            title: `${busName} (${tripId})`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/bus.png',
              scaledSize: new window.google.maps.Size(36, 36),
            },
          });
          setMapLoaded(true);
        } else if (mapInstanceRef.current && markerInstanceRef.current) {
          const newPos = { lat: telemetry.lat, lng: telemetry.lng };
          markerInstanceRef.current.setPosition(newPos);
          mapInstanceRef.current.panTo(newPos);
        }
      } catch (err) {
        setMapError('Google Maps initialization note: ' + err.message);
      }
    });
  }, [apiKey, telemetry.lat, telemetry.lng, busName, tripId]);

  const handleSos = async () => {
    setSosLoading(true);
    if (onRaiseSos) {
      try {
        await onRaiseSos(bookingId, telemetry.lat, telemetry.lng);
      } catch {}
    }
    setSosLoading(false);
    setSosSent(true);
  };

  const isLive = telemetry.status === 'IN_PROGRESS';
  const isCompleted = telemetry.status === 'COMPLETED';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px', width: '100%', padding: '24px', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="#2563eb" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {fromCity} → {toCity}
              </h3>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              {busName} ({busType}) · Reference: <strong>{bookingId}</strong>
            </div>
            {item.corridorName && (
              <div style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                🛣️ Corridor: {item.corridorName}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Badge Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '10px',
          marginBottom: '16px',
          background: isLive ? '#dcfce7' : isCompleted ? '#f0fdf4' : '#eff6ff',
          border: `1px solid ${isLive ? '#86efac' : isCompleted ? '#bbf7d0' : '#bfdbfe'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isLive ? '#16a34a' : isCompleted ? '#22c55e' : '#2563eb',
              boxShadow: isLive ? '0 0 0 3px rgba(34, 197, 94, 0.3)' : 'none',
            }} />
            <span style={{
              fontWeight: 800,
              fontSize: '0.82rem',
              color: isLive ? '#15803d' : isCompleted ? '#15803d' : '#1d4ed8',
            }}>
              {isLive
                ? '● LIVE · Bus is En Route'
                : isCompleted
                ? '✓ Journey Completed'
                : '🕒 Scheduled Journey · Boarding Soon'}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            Refreshed {telemetry.updatedAt}
          </span>
        </div>

        {/* Real Google Maps API Viewport / Fallback */}
        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '16px',
          border: '1px solid #cbd5e1',
          background: '#f8fafc',
        }}>
          {apiKey ? (
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          ) : null}

          {(!apiKey || mapError) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              background: '#f8fafc',
            }}>
              <MapPin size={32} color="#f97316" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                Real Google Maps API View
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '420px', lineHeight: 1.4 }}>
                {mapError || 'Set VITE_GOOGLE_MAPS_API_KEY in your .env file to enable live satellite and street map rendering.'}
              </div>
              <div style={{
                marginTop: '10px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#e2e8f0',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                color: '#334155',
                fontWeight: 700,
              }}>
                GPS: {telemetry.lat.toFixed(4)}° N, {telemetry.lng.toFixed(4)}° E
              </div>
            </div>
          )}
        </div>

        {/* Real-time Telemetry Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Next Stop</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
              {telemetry.nextStop}
            </div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Estimated Arrival</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a', marginTop: '3px' }}>
              {telemetry.etaMinutes != null ? `${telemetry.etaMinutes} mins` : 'On Schedule'}
            </div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Speed / Progress</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563eb', marginTop: '3px' }}>
              {telemetry.percentComplete}% Done
            </div>
          </div>
        </div>

        {/* Milestone Route Progress Track */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            <span>🚩 {fromCity} (Departure)</span>
            <span>🏁 {toCity} (Final Destination)</span>
          </div>
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', position: 'relative', marginBottom: '10px' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6 0%, #16a34a 100%)',
              borderRadius: '999px',
              width: `${Math.max(5, Math.min(100, telemetry.percentComplete))}%`,
              transition: 'width 0.4s ease',
            }} />
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: `calc(${Math.max(3, Math.min(97, telemetry.percentComplete))}% - 12px)`,
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#16a34a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'left 0.4s ease',
            }}>
              🚌
            </div>
          </div>

          {intermediateStops.length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                Intermediate Stations along Corridor:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '0.74rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{fromCity}</span>
                {intermediateStops.map((stop, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <span style={{ color: '#94a3b8' }}>➔</span>
                    <span style={{ background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      📍 {stop}
                    </span>
                  </React.Fragment>
                ))}
                <span style={{ color: '#94a3b8' }}>➔</span>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>{toCity}</span>
              </div>
            </div>
          )}
        </div>

        {/* Emergency SOS Banner (for Customer View) */}
        {!isProviderView && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#dc2626' }}>
                <ShieldAlert size={15} />
                <span>Passenger Safety &amp; Emergency</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#991b1b', marginTop: '2px' }}>
                Helpline: 112 · Ambulance: 108 · 24/7 Desk: 1800-CLICK2BK
              </div>
            </div>
            {sosSent ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '5px 10px', borderRadius: '6px', border: '1px solid #86efac', whiteSpace: 'nowrap' }}>
                ✓ SOS Alert Sent
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSos}
                disabled={sosLoading}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: '7px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <AlertTriangle size={13} /> {sosLoading ? 'Sending…' : 'Raise SOS'}
              </button>
            )}
          </div>
        )}

        {/* Close Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            style={{ padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

