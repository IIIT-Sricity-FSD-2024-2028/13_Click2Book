import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLiveTrips, startTrip, endTrip, updateLocation } from '../services/api';

/* ── Helper: check if a trip's departure time has passed ── */
function hasDepartureTimePassed(item) {
  try {
    const schedule = item?.schedule;
    if (!schedule) return false;

    const journeyDate   = schedule.journeyDate;    // "YYYY-MM-DD"
    const departureTime = schedule.departureTime;  // "HH:MM"

    if (!journeyDate || !departureTime) return false;

    // Build a Date for departure
    const [hh, mm]     = departureTime.split(':').map(Number);
    const depDate      = new Date(journeyDate);
    if (isNaN(depDate.getTime())) return false;
    depDate.setHours(hh, mm, 0, 0);

    return new Date() >= depDate;
  } catch {
    return false;
  }
}

/* ── Auto-start any SCHEDULED trip whose departure time has passed ── */
function autoStartDueTrips(trips) {
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  let changed = false;

  trips.forEach((item) => {
    const tripId       = item?.trip?.tripId;
    const currentStatus = statuses[tripId] || item?.trip?.tripStatus || 'SCHEDULED';

    if (currentStatus === 'SCHEDULED' && hasDepartureTimePassed(item)) {
      statuses[tripId] = 'IN_PROGRESS';
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  }
  return changed;
}

/* ─────────────────────────────────────────────────────────────
   TripCard (unchanged logic, only reads localStatus from fresh storage)
   ───────────────────────────────────────────────────────────── */
function TripCard({ item, onStart, onEnd, onUpdateLocation }) {
  const { trip, schedule, route, vehicle } = item;
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [status, setStatus] = useState('EN_ROUTE');
  const [nextStop, setNextStop] = useState('');
  const [localStatus, setLocalStatus] = useState(() => {
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    return statuses[trip?.tripId] || trip?.tripStatus || trip?.tripId?.startsWith('T') ? (JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}')[trip?.tripId] || trip?.tripStatus || 'SCHEDULED') : 'SCHEDULED';
  });

  // Sync localStatus whenever localStorage may have been updated by the auto-start
  useEffect(() => {
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const fresh = statuses[trip?.tripId] || trip?.tripStatus || 'SCHEDULED';
    setLocalStatus(fresh);
  }, [trip]);

  const routeLabel = route
    ? `${route.source} → ${route.destination}`
    : schedule?.from && schedule?.to
    ? `${schedule.from} → ${schedule.to}`
    : 'Unknown Route';
  const when = schedule ? `${schedule.journeyDate || ''} at ${schedule.departureTime || ''}` : '';
  const vehicleLabel = vehicle?.vehicleNumber || trip?.vehicleId || '';
  const viaInfo = schedule?.via ? ` · Via: ${schedule.via}` : '';

  const handleStart = async () => {
    await onStart(trip.tripId);
    setLocalStatus('IN_PROGRESS');
  };

  const handleEnd = async () => {
    if (!window.confirm('Has the destination been reached? Mark this trip as Completed?')) return;
    await onEnd(trip.tripId);
    setLocalStatus('COMPLETED');
  };

  const handleUpdateLoc = async () => {
    const latNum = parseFloat(lat), lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) { alert('Enter valid latitude and longitude.'); return; }
    try {
      await onUpdateLocation(trip.tripId, latNum, lngNum, status, nextStop);
      alert('Location updated.');
    } catch (e) { alert('Could not update location: ' + e.message); }
  };

  const handleSimulate = async () => {
    const baseLat = parseFloat(lat) || 17.385;
    const baseLng = parseFloat(lng) || 78.4867;
    const simLat = (baseLat + (Math.random() - 0.5) * 0.05).toFixed(4);
    const simLng = (baseLng + (Math.random() - 0.5) * 0.05).toFixed(4);
    setLat(simLat); setLng(simLng);
    try {
      await onUpdateLocation(trip.tripId, parseFloat(simLat), parseFloat(simLng), 'EN_ROUTE', '');
    } catch (e) { alert('Could not update: ' + e.message); }
  };

  const badgeClass  = localStatus === 'IN_PROGRESS' ? 'badge-green' : localStatus === 'COMPLETED' ? 'badge-green' : 'badge-orange';
  const statusLabel = localStatus === 'IN_PROGRESS' ? '● Live / In Progress' : localStatus === 'COMPLETED' ? '✓ Completed' : 'Scheduled';

  return (
    <div className={`trip-card ${localStatus === 'COMPLETED' ? 'confirmed' : ''}`}>
      <div style={{ flex: 1 }}>
        <div className="card-title">
          {routeLabel}
          <span className={`badge ${badgeClass}`}>{statusLabel}</span>
          {/* Auto-started indicator */}
          {localStatus === 'IN_PROGRESS' && hasDepartureTimePassed(item) && (
            <span className="badge badge-orange" style={{ fontSize: '0.68rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
              ⏰ Auto-started
            </span>
          )}
        </div>
        <div className="card-meta">
          <div className="card-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {when}{viaInfo}
          </div>
          <div className="card-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            {vehicleLabel} · Trip {trip?.tripId}
          </div>
        </div>
      </div>

      <div className="trip-action-area">
        {localStatus === 'SCHEDULED' && (
          <button
            className="btn btn-success"
            onClick={handleStart}
            style={{ padding: '8px 16px', fontWeight: 700 }}
          >
            ▶ Start Trip
          </button>
        )}
        {localStatus === 'IN_PROGRESS' && (
          <>
            <div className="location-inputs">
              <input type="number" step="0.0001" placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} />
              <input type="number" step="0.0001" placeholder="Lng" value={lng} onChange={(e) => setLng(e.target.value)} />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="EN_ROUTE">En Route</option>
                <option value="AT_STOP">At Stop</option>
                <option value="ARRIVED">Arrived</option>
              </select>
              <input type="text" placeholder="Next stop" value={nextStop} onChange={(e) => setNextStop(e.target.value)} />
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleUpdateLoc}>Update</button>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#a855f7', borderColor: '#e9d5ff' }} onClick={handleSimulate}>🎲 Simulate</button>
            </div>
            <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={handleEnd}>
              🏁 End Trip (Destination Reached)
            </button>
          </>
        )}
        {localStatus === 'COMPLETED' && (
          <div className="text-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            🏁 Trip Ended (Destination Reached)
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main ConfirmTrips page
   ───────────────────────────────────────────────────────────── */
export default function ConfirmTrips({ provider, showToast }) {
  const [trips,   setTrips]   = useState([]);
  const [isLive,  setIsLive]  = useState(false);
  const [loading, setLoading] = useState(true);

  // Track which trips were auto-notified so we don't toast repeatedly
  const notifiedRef = useRef(new Set());

  const providerId = provider?.id
    || sessionStorage.getItem('c2b_loggedInId')
    || localStorage.getItem('c2b_loggedInId')
    || 'P001';

  const load = useCallback(async () => {
    const { data, isLive: live } = await fetchLiveTrips(providerId);
    setTrips(data);
    setIsLive(live);
    setLoading(false);
    return data;
  }, [providerId]);

  // ── Initial load ──
  useEffect(() => { load(); }, [load]);

  // ── Auto-start checker: runs every 60 s ──
  useEffect(() => {
    const check = () => {
      if (!trips.length) return;

      const changed = autoStartDueTrips(trips);

      if (changed) {
        // Find newly auto-started trips to toast
        const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
        trips.forEach((item) => {
          const tripId = item?.trip?.tripId;
          if (
            statuses[tripId] === 'IN_PROGRESS' &&
            !notifiedRef.current.has(tripId) &&
            hasDepartureTimePassed(item)
          ) {
            const route = item?.route
              ? `${item.route.source} → ${item.route.destination}`
              : item?.schedule?.from && item?.schedule?.to
              ? `${item.schedule.from} → ${item.schedule.to}`
              : tripId;
            showToast(`⏰ Trip auto-started: ${route} — departure time reached!`, 'info');
            notifiedRef.current.add(tripId);
          }
        });

        // Force re-render TripCards by refreshing trips array in-place
        setTrips((prev) => [...prev]);
      }
    };

    // Run immediately on mount/trips change
    check();

    const interval = setInterval(check, 60_000); // check every 60 s
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips.length, showToast]);

  const handleStart = async (tripId) => {
    await startTrip(tripId);
    showToast('▶ Trip started! Passenger tracking is now live.', 'success');
    await load();
  };
  const handleEnd = async (tripId) => {
    await endTrip(tripId);
    showToast('🏁 Trip marked as Completed! Passengers will see Destination Reached.', 'success');
    await load();
  };
  const handleUpdateLoc = async (tripId, lat, lng, status, nextStop) => {
    await updateLocation(tripId, lat, lng, status, nextStop, providerId);
  };

  if (loading) return <div className="empty-state" style={{ paddingTop: '4rem' }}><p>⏳ Loading trips…</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Confirm Trips</h3>
          <p>Verify and confirm upcoming trips</p>
        </div>
        {isLive ? (
          <span className="live-badge"><span className="live-dot" />Live</span>
        ) : (
          <span className="offline-badge">🟡 Offline</span>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Live Trips</h4>
        <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>
          Start a trip once the driver departs, then report its location for customer tracking.
          Trips automatically switch to <strong>In Progress</strong> when their scheduled departure time is reached.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state"><p>No trips found for your fleet yet.</p></div>
      ) : (
        trips.map((item, i) => (
          <TripCard
            key={item?.trip?.tripId || i}
            item={item}
            onStart={handleStart}
            onEnd={handleEnd}
            onUpdateLocation={handleUpdateLoc}
          />
        ))
      )}

      {/* Static fallback cards matching original HTML */}
      <div className="trip-card">
        <div style={{ flex: 1 }}>
          <div className="card-title">
            SriCity → Chennai
            <span className="badge badge-orange">Pending</span>
          </div>
          <div className="card-meta">
            <div className="card-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {new Date().toISOString().split('T')[0]} at 06:00
            </div>
            <div className="card-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              MH01AB1234 · Driver: Ramesh Kumar
            </div>
            <div className="card-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              32 passengers confirmed
            </div>
          </div>
        </div>
        <div>
          <button className="btn btn-outline" style={{ color: '#f59e0b', borderColor: '#fde68a' }}>⚠ Pending</button>
        </div>
      </div>

      <div className="trip-card confirmed">
        <div style={{ flex: 1 }}>
          <div className="card-title">
            Pune → Mumbai
            <span className="badge badge-green">Confirmed</span>
          </div>
          <div className="card-meta">
            <div className="card-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {new Date().toISOString().split('T')[0]} at 20:00
            </div>
            <div className="card-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              MH02CD5678 · Driver: Rama Krishna
            </div>
            <div className="card-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              15 passengers confirmed
            </div>
          </div>
        </div>
        <div className="text-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Trip Confirmed
        </div>
      </div>
    </div>
  );
}
