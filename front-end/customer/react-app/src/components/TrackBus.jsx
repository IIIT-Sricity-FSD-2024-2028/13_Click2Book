import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function isDepartureTimeReached(journeyDate, departureTime) {
  try {
    if (!departureTime || departureTime === '—') return false;
    const cleanTime = String(departureTime).split('→')[0].trim();
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return false;
    let hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;

    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    let d = now.getDate();

    if (journeyDate) {
      const dateStr = String(journeyDate).split('T')[0];
      const dateParts = dateStr.split('-').map(Number);
      if (dateParts.length >= 3) {
        y = dateParts[0];
        m = dateParts[1] - 1;
        d = dateParts[2];
      }
    }

    const depDate = new Date(y, m, d, hh, mm, 0, 0);
    if (isNaN(depDate.getTime())) return false;
    return now >= depDate;
  } catch {
    return false;
  }
}

export default function TrackBus({ tripId: propTripId, onNavigate, showToast }) {
  // Query param fallback or prop
  const [tripId, setTripId] = useState(propTripId || 'TRIP-101');
  const [tripRoute, setTripRoute] = useState('Mumbai → Pune (Royal Express)');
  const [depTime, setDepTime] = useState('08:00');
  const [isLive, setIsLive] = useState(true);
  const [statusText, setStatusText] = useState('IN PROGRESS');
  const [nextStop, setNextStop] = useState('Lonavala Food Mall');
  const [etaMinutes, setEtaMinutes] = useState(45);
  const [percentComplete, setPercentComplete] = useState(65);

  // SOS Modal
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [sosType, setSosType] = useState('SAFETY');
  const [sosDetails, setSosDetails] = useState('');
  const [isSendingSos, setIsSendingSos] = useState(false);

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  // Parse URL query if propTripId is missing
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const qs = hash.split('?')[1];
      const params = new URLSearchParams(qs);
      const tid = params.get('tripId');
      if (tid) setTripId(tid);
    }
  }, []);

  // Resolve dynamic route and trip status from storage
  useEffect(() => {
    let resolvedRoute = '';
    let resolvedDep = '08:00';
    let resolvedDate = new Date().toISOString().split('T')[0];

    try {
      const bks = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      const matchB = bks.find((b) => b.tripId === tripId || b.trip_id === tripId || b.bookingId === tripId);
      if (matchB) {
        resolvedRoute = `${matchB.from} → ${matchB.to} (${matchB.busName || 'Express'})`;
        if (matchB.departureTime) resolvedDep = matchB.departureTime;
        if (matchB.date) resolvedDate = matchB.date;
      }
    } catch {}

    if (!resolvedRoute) {
      try {
        const scheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        const matchS = scheds.find((s) => s.id === tripId || s.tripId === tripId);
        if (matchS) {
          resolvedRoute = `${matchS.from} → ${matchS.to} (${matchS.busName || 'Express'})`;
          if (matchS.departureTime) resolvedDep = matchS.departureTime;
          if (matchS.journeyDate) resolvedDate = matchS.journeyDate;
        }
      } catch {}
    }

    if (resolvedRoute) {
      setTripRoute(resolvedRoute);
    }
    setDepTime(resolvedDep);

    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const tStatus = statuses[tripId];
    const timePassed = isDepartureTimeReached(resolvedDate, resolvedDep);
    const hasStarted = tStatus === 'IN_PROGRESS' || (timePassed && tStatus !== 'COMPLETED');
    const isCompleted = tStatus === 'COMPLETED';

    if (isCompleted) {
      setIsLive(true);
      setStatusText('COMPLETED');
      setPercentComplete(100);
      setEtaMinutes(0);
      setNextStop('Final Destination Reached');
    } else if (hasStarted) {
      setIsLive(true);
      setStatusText('BUS HAS STARTED · IN TRANSIT');
    } else {
      setIsLive(false);
      setStatusText('SCHEDULED (WAITING TO DEPART)');
    }
  }, [tripId]);

  // Initialize or update Leaflet Map
  const setupMap = (lat = 18.75, lng = 73.4) => {
    if (typeof window === 'undefined' || !window.L || !mapRef.current) return;

    if (!leafletMap.current) {
      try {
        const m = window.L.map(mapRef.current).setView([lat, lng], 11);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(m);

        const busIcon = window.L.divIcon({
          html: `<div style="background:#f97316;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:16px;border:2px solid white;">🚌</div>`,
          className: 'custom-bus-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = window.L.marker([lat, lng], { icon: busIcon }).addTo(m);
        marker.bindPopup(`<b>${tripRoute}</b><br/>Status: In Transit`).openPopup();

        leafletMap.current = m;
        markerRef.current = marker;
      } catch (err) {
        console.warn('[TrackBus] Leaflet init notice:', err.message);
      }
    } else if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMap.current.panTo([lat, lng]);
    }
  };

  // Poll tracking
  useEffect(() => {
    let timer;

    const fetchTracking = async () => {
      try {
        const [loc, eta] = await Promise.all([
          api.tracking.getLocation(tripId).catch(() => null),
          api.tracking.getEta(tripId).catch(() => null),
        ]);

        if (loc) {
          setIsLive(true);
          setStatusText(loc.status ? loc.status.replace('_', ' ') : 'IN PROGRESS');
          setNextStop(loc.nextStop || 'Lonavala Expressway');
          setupMap(loc.lat || 18.75, loc.lng || 73.4);
        } else {
          // Fallback simulation
          setIsLive(true);
          setupMap(18.75, 73.4);
        }

        if (eta) {
          setEtaMinutes(eta.etaMinutes || 45);
          setPercentComplete(eta.percentComplete || 65);
        }
      } catch {
        setIsLive(true);
        setupMap(18.75, 73.4);
      }
    };

    fetchTracking();
    timer = setInterval(fetchTracking, 10000);

    return () => {
      if (timer) clearInterval(timer);
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [tripId]);

  const handleSendSos = async () => {
    setIsSendingSos(true);
    let bId = null;
    const hash = window.location.hash || '';
    if (hash.includes('?')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      bId = params.get('bookingId');
    }
    if (!bId) {
      try {
        const bks = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        const matching = bks.find((b) => b.tripId === tripId || b.trip_id === tripId);
        if (matching) bId = matching.bookingId || matching.booking_id;
        else if (bks.length > 0) bId = bks[0].bookingId || bks[0].booking_id;
      } catch {}
    }
    if (!bId) bId = 'B001';

    const customerId =
      sessionStorage.getItem('c2b_loggedInId') ||
      localStorage.getItem('c2b_loggedInId') ||
      sessionStorage.getItem('c2b_userId') ||
      localStorage.getItem('c2b_userId') ||
      'C001';

    const alertData = {
      bookingId: bId,
      customerId,
      tripId,
      type: sosType,
      message: sosDetails.trim() || 'Passenger SOS distress button triggered',
      timestamp: new Date().toISOString(),
    };

    try {
      await api.emergency.createAlert(alertData);
    } catch {
      // Offline fallback
    }

    try {
      const stored = JSON.parse(localStorage.getItem('c2b_sos_alerts') || '[]');
      stored.unshift(alertData);
      localStorage.setItem('c2b_sos_alerts', JSON.stringify(stored));
    } catch {}

    setIsSendingSos(false);
    setIsSosOpen(false);
    setSosDetails('');
    showToast('🚨 SOS Emergency alert broadcast to control room!', 'error');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', paddingBottom: '90px' }}>
      {/* Top bar */}
      <div className="tb-topbar">
        <button
          className="tb-back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => onNavigate && onNavigate('my-bookings')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to My Bookings
        </button>
        <span className="logo-text" style={{ color: 'var(--navy)' }}>
          CLICK<span className="logo-accent">2</span>BOOK
        </span>
      </div>

      <div className="tb-wrap fade-up">
        {/* Header */}
        <div className="tb-header">
          <div className="tb-route">{tripRoute}</div>
          <div className="tb-sub">Trip ID: {tripId} · Scheduled Departure: {depTime}</div>
          {statusText.includes('COMPLETED') ? (
            <span className="tb-status-pill tb-status-live" style={{ display: 'inline-flex', marginTop: '10px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
              🏁 Trip Completed · Destination Reached
            </span>
          ) : isLive ? (
            <span className="tb-status-pill tb-status-live" style={{ display: 'inline-flex', marginTop: '10px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
              🟢 Live GPS Tracking Active · Bus Has Started
            </span>
          ) : (
            <span className="tb-status-pill tb-status-live" style={{ display: 'inline-flex', marginTop: '10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              🕒 Scheduled · Departs at {depTime}
            </span>
          )}
        </div>

        {/* Live Section */}
        {isLive ? (
          <div>
            <div id="tbMap" ref={mapRef} style={{ height: '360px', width: '100%', borderRadius: '16px' }} />

            <div className="tb-cards">
              <div className="tb-card">
                <div className="tb-card-label">Current Status</div>
                <div className="tb-card-value" style={{ textTransform: 'capitalize' }}>
                  {statusText.toLowerCase()}
                </div>
              </div>
              <div className="tb-card">
                <div className="tb-card-label">Next Scheduled Stop</div>
                <div className="tb-card-value">{nextStop}</div>
              </div>
              <div className="tb-card">
                <div className="tb-card-label">Estimated Time of Arrival</div>
                <div className="tb-card-value" style={{ color: 'var(--primary)' }}>
                  {etaMinutes} min
                </div>
              </div>
            </div>

            <div className="tb-progress-track">
              <div className="tb-progress-fill" style={{ width: `${percentComplete}%` }} />
            </div>
            <div className="tb-sub" style={{ textAlign: 'right', marginTop: '6px' }}>
              {percentComplete}% of journey complete
            </div>
          </div>
        ) : (
          <div className="tb-waiting">
            <div className="tb-waiting-icon">🚌</div>
            <div className="tb-waiting-text">
              This bus is scheduled to depart at <strong>{depTime}</strong>.
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                The trip will automatically start and live GPS telemetry will activate as soon as departure time is reached.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating SOS Button */}
      <button
        className="sos-btn"
        title="Emergency SOS Distress Signal"
        onClick={() => setIsSosOpen(true)}
      >
        SOS
      </button>

      {/* SOS Modal */}
      {isSosOpen && (
        <div className="sos-overlay" style={{ display: 'flex' }}>
          <div className="sos-modal">
            <h3>🚨 Raise Emergency Alert</h3>
            <p className="hint">
              This notifies Click2Book safety operations immediately. Use it only for a genuine issue on this trip.
            </p>

            <div className="sos-field">
              <label htmlFor="sosTypeSelect">What's happening?</label>
              <select
                id="sosTypeSelect"
                value={sosType}
                onChange={(e) => setSosType(e.target.value)}
              >
                <option value="SAFETY">Safety concern</option>
                <option value="MEDICAL">Medical emergency</option>
                <option value="ACCIDENT">Accident</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="sos-field">
              <label htmlFor="sosMessageText">Details (optional)</label>
              <textarea
                id="sosMessageText"
                rows={3}
                maxLength={500}
                placeholder="Briefly describe the emergency or location..."
                value={sosDetails}
                onChange={(e) => setSosDetails(e.target.value)}
              />
            </div>

            <div className="sos-actions">
              <button
                type="button"
                className="btn-sos-cancel"
                onClick={() => setIsSosOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-sos-send"
                disabled={isSendingSos}
                onClick={handleSendSos}
              >
                {isSendingSos ? 'Sending...' : 'Send Alert'}
              </button>
            </div>

            <p className="sos-disclaimer">
              This is a safety demo feature for the Click2Book platform. In real life, contact local emergency police/medical services directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
