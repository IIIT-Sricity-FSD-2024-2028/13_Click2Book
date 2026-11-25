import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLiveTrips, confirmTrip, startTrip, endTrip, updateLocation, getFleetBuses } from '../services/api';
import { memStorage } from '../store/memoryBridge';
import { navigateTabThunk, showToastThunk } from '../store/actions';
import { fmtDateWithDay } from './ManageSchedules';

/* ── Helper: check if a trip's departure time has passed ── */
function hasDepartureTimePassed(item) {
  try {
    const schedule = item?.schedule;
    if (!schedule) return false;

    const journeyDate   = schedule.journeyDate;    // "YYYY-MM-DD"
    const departureTime = schedule.departureTime;  // "HH:MM"

    if (!journeyDate || !departureTime) return false;

    const dateParts = String(journeyDate).split('T')[0].split('-').map(Number);
    if (dateParts.length < 3) return false;
    const [year, month, day] = dateParts;

    const cleanTime = String(departureTime).split('→')[0].trim();
    const timeParts = cleanTime.split(':').map(Number);
    const hh = timeParts[0] || 0;
    const mm = timeParts[1] || 0;

    const depDate = new Date(year, month - 1, day, hh, mm, 0, 0);
    if (isNaN(depDate.getTime())) return false;

    return new Date() >= depDate;
  } catch {
    return false;
  }
}

/* ── Auto-start any SCHEDULED / CONFIRMED trip whose departure time has passed ── */
function autoStartDueTrips(trips) {
  const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
  let changed = false;

  (trips || []).forEach((item) => {
    const tripId = item?.trip?.tripId;
    if (!tripId) return;
    const currentStatus = (statuses[tripId] || item?.trip?.tripStatus || 'SCHEDULED').toUpperCase();

    if ((currentStatus === 'SCHEDULED' || currentStatus === 'CONFIRMED' || currentStatus === 'PENDING') && hasDepartureTimePassed(item)) {
      statuses[tripId] = 'IN_PROGRESS';
      changed = true;
    }
  });

  if (changed) {
    memStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  }
  return changed;
}

function TripCard({ item, onConfirm, onStart, onEnd, onUpdateLocation }) {
  const { trip, schedule, route, vehicle } = item;
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [status, setStatus] = useState('EN_ROUTE');
  const [nextStop, setNextStop] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(() => {
    const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
    return statuses[trip?.tripId] || trip?.tripStatus || 'SCHEDULED';
  });

  useEffect(() => {
    const updateFreshStatus = () => {
      const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
      const fresh = statuses[trip?.tripId] || trip?.tripStatus || 'SCHEDULED';
      setLocalStatus(fresh);
    };
    updateFreshStatus();
    window.addEventListener('c2b_sync', updateFreshStatus);
    return () => {
      window.removeEventListener('c2b_sync', updateFreshStatus);
    };
  }, [trip, trip?.tripId, trip?.tripStatus]);

  const routeLabel = route
    ? `${route.source} → ${route.destination}`
    : schedule?.from && schedule?.to
    ? `${schedule.from} → ${schedule.to}`
    : 'Corridor Route';

  const when = schedule ? `${fmtDateWithDay(schedule.journeyDate)} at ${schedule.departureTime || ''}` : '';
  const vehicleLabel = vehicle?.vehicleNumber || trip?.vehicleId || 'Assigned Coach';
  const viaInfo = schedule?.via ? ` · Via: ${schedule.via}` : '';
  const dirLabel = schedule?.direction === 'UP' ? '⬆ UP' : '⬇ DOWN';

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      setLocalStatus('CONFIRMED');
      await onConfirm(trip.tripId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartAction = async () => {
    setActionLoading(true);
    try {
      setLocalStatus('IN_PROGRESS');
      await onStart(trip.tripId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndAction = async () => {
    if (!window.confirm('Has the destination been reached? Mark this trip as Completed?')) return;
    setActionLoading(true);
    try {
      setLocalStatus('COMPLETED');
      await onEnd(trip.tripId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLoc = async () => {
    const latNum = parseFloat(lat), lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert('Enter valid latitude and longitude coordinates.');
      return;
    }
    try {
      await onUpdateLocation(trip.tripId, latNum, lngNum, status, nextStop);
      alert('Live location coordinates updated successfully.');
    } catch (e) {
      alert('Location saved locally.');
    }
  };

  const handleSimulate = async () => {
    const baseLat = parseFloat(lat) || 17.385;
    const baseLng = parseFloat(lng) || 78.4867;
    const simLat = (baseLat + (Math.random() - 0.5) * 0.05).toFixed(4);
    const simLng = (baseLng + (Math.random() - 0.5) * 0.05).toFixed(4);
    setLat(simLat);
    setLng(simLng);
    try {
      await onUpdateLocation(trip.tripId, parseFloat(simLat), parseFloat(simLng), 'EN_ROUTE', nextStop || 'Next Stop');
    } catch (e) {}
  };

  const normStatus = (localStatus || 'SCHEDULED').toUpperCase();

  const isLiveOrGoing = normStatus === 'IN_PROGRESS' || normStatus === 'ON_GOING' || normStatus === 'ONGOING';
  const isConfirmed = normStatus === 'CONFIRMED';
  const isCompleted = normStatus === 'COMPLETED';
  const isScheduled = normStatus === 'SCHEDULED' || normStatus === 'PENDING';

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = (schedule?.journeyDate || '').split('T')[0] === todayStr;

  return (
    <div className={`trip-card ${isCompleted ? 'confirmed' : ''}`} style={{ transition: 'all 0.2s ease', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>{routeLabel}</span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              background: schedule?.direction === 'UP' ? '#e0f2fe' : '#fef3c7',
              color: schedule?.direction === 'UP' ? '#0369a1' : '#b45309',
              border: `1px solid ${schedule?.direction === 'UP' ? '#bae6fd' : '#fde68a'}`,
            }}
          >
            {dirLabel}
          </span>
          {isToday && (
            <span className="badge badge-green" style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontWeight: 800 }}>
              🌟 Today's Trip
            </span>
          )}

          {/* Status Badges */}
          {isLiveOrGoing && (
            <span className="badge badge-green" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 800 }}>
              ● Live / In Progress
            </span>
          )}
          {isConfirmed && (
            <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', fontWeight: 800 }}>
              ✓ Confirmed (Ready to Depart)
            </span>
          )}
          {isScheduled && (
            <span className="badge badge-orange" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', fontWeight: 800 }}>
              ⏳ Scheduled
            </span>
          )}
          {isCompleted && (
            <span className="badge badge-green" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800 }}>
              🏁 Completed
            </span>
          )}

          {/* Auto-started indicator */}
          {isLiveOrGoing && hasDepartureTimePassed(item) && (
            <span className="badge badge-orange" style={{ fontSize: '0.68rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
              ⏰ Auto-started
            </span>
          )}
        </div>

        <div className="card-meta" style={{ marginTop: '6px' }}>
          <div className="card-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <strong>{when}</strong>{viaInfo}
          </div>
          <div className="card-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{vehicleLabel}</span> {vehicle?.busName ? `(${vehicle.busName})` : ''} · Trip ID: <code style={{ fontSize: '0.76rem', color: '#64748b' }}>{trip?.tripId}</code>
          </div>
        </div>
      </div>

      <div className="trip-action-area" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Action: Scheduled / Pending */}
        {isScheduled && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleConfirmAction}
              disabled={actionLoading}
              style={{
                padding: '7px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                background: '#eff6ff',
                borderColor: '#60a5fa',
                color: '#1d4ed8',
                cursor: 'pointer',
              }}
              title="Confirm that the coach is inspected and ready to depart"
            >
              ✅ Confirm Trip
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleStartAction}
              disabled={actionLoading}
              style={{
                padding: '7px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Depart this coach and begin live GPS tracking"
            >
              ▶ Start Trip
            </button>
          </div>
        )}

        {/* Action: Confirmed */}
        {isConfirmed && (
          <button
            type="button"
            className="btn btn-success"
            onClick={handleStartAction}
            disabled={actionLoading}
            style={{
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.84rem',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Depart this coach and begin live GPS tracking"
          >
            ▶ Depart / Start Trip
          </button>
        )}

        {/* Action: Live / In Progress */}
        {isLiveOrGoing && (
          <>
            <div className="location-inputs" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                step="0.0001"
                placeholder="Lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ width: '85px', padding: '5px 7px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ width: '85px', padding: '5px 7px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ padding: '5px 7px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="EN_ROUTE">En Route</option>
                <option value="AT_STOP">At Stop</option>
                <option value="ARRIVED">Arrived</option>
              </select>
              <input
                type="text"
                placeholder="Next stop"
                value={nextStop}
                onChange={(e) => setNextStop(e.target.value)}
                style={{ width: '100px', padding: '5px 7px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                onClick={handleUpdateLoc}
              >
                Update
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '5px 10px', fontSize: '0.78rem', color: '#7c3aed', borderColor: '#ddd6fe' }}
                onClick={handleSimulate}
                title="Simulate random live coordinates for testing passenger map"
              >
                🎲 Simulate
              </button>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '7px 14px', fontSize: '0.82rem', fontWeight: 700 }}
              onClick={handleEndAction}
              disabled={actionLoading}
            >
              🏁 End Trip (Destination Reached)
            </button>
          </>
        )}

        {/* Action: Completed */}
        {isCompleted && (
          <div className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.86rem' }}>
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
export default function ConfirmTrips() {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.auth.provider);
  const onNavigate = (tab) => dispatch(navigateTabThunk(tab));
  const showToast = (msg, type = 'info') => dispatch(showToastThunk(msg, type));

  const [trips,          setTrips]          = useState([]);
  const [isLive,         setIsLive]         = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [category,       setCategory]       = useState('All');
  const [busFilter,      setBusFilter]      = useState('all');
  const [busSearchQuery, setBusSearchQuery] = useState('');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [datePreset,     setDatePreset]     = useState('today');
  const [specificDate,   setSpecificDate]   = useState(new Date().toISOString().split('T')[0]);

  const providerId = provider?.id || 'P001';

  // Read registered fleet buses from Bus Fleet Management to ensure strict alignment
  const fleetBuses = useMemo(() => {
    return getFleetBuses(providerId).filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);
  }, [providerId]);

  // Track unique bus plate numbers for the Bus Number filter dropdown
  const uniqueBusNumbers = useMemo(() => {
    const set = new Set();
    fleetBuses.forEach((b) => {
      const plate = b.vehicleNumber || b.regNo;
      if (plate && plate !== '—') set.add(String(plate).trim().toUpperCase());
    });
    trips.forEach((item) => {
      const plate = item?.vehicle?.vehicleNumber || item?.schedule?.vehicleNumber || item?.trip?.vehicleId;
      if (plate && plate !== '—') set.add(String(plate).trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [fleetBuses, trips]);

  // Track which trips were auto-notified so we don't toast repeatedly
  const notifiedRef = useRef(new Set());
  const tripsRef = useRef([]);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const { data, isLive: live } = await fetchLiveTrips(providerId);
      autoStartDueTrips(data);
      const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
      const synced = (data || []).map((item) => {
        const tid = item?.trip?.tripId;
        return {
          ...item,
          trip: {
            ...item.trip,
            tripStatus: statuses[tid] || item?.trip?.tripStatus || 'SCHEDULED',
          },
        };
      });
      setTrips(synced);
      setIsLive(live);
      return synced;
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // ── Initial load ──
  useEffect(() => {
    load(true);
  }, [load]);

  // ── Listen for real-time changes silently (cross-tab & intra-tab sync) ──
  useEffect(() => {
    const handleSync = () => { load(false); };
    window.addEventListener('storage', handleSync);
    window.addEventListener('c2b_sync', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('c2b_sync', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [load]);

  // ── Auto-start checker: checks trips and auto-starts parallelly when departure time is reached ──
  useEffect(() => {
    const check = () => {
      const curTrips = tripsRef.current || [];
      if (!curTrips.length) return;

      const changed = autoStartDueTrips(curTrips);

      if (changed) {
        const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
        curTrips.forEach((item) => {
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
            showToast && showToast(`⏰ Trip auto-started: ${route} — departure time reached!`, 'info');
            notifiedRef.current.add(tripId);
          }
        });

        // Force parallel re-render of TripCards by updating trips with fresh statuses
        setTrips((prev) =>
          prev.map((item) => {
            const tid = item?.trip?.tripId;
            return {
              ...item,
              trip: {
                ...item.trip,
                tripStatus: statuses[tid] || item?.trip?.tripStatus || 'SCHEDULED',
              },
            };
          })
        );
      }
    };

    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [showToast]);

  const handleConfirm = async (tripId) => {
    try {
      await confirmTrip(tripId);
      showToast && showToast('✅ Trip confirmed! Coach is verified and ready to depart.', 'success');
      setTrips((prev) =>
        prev.map((t) => (t.trip?.tripId === tripId ? { ...t, trip: { ...t.trip, tripStatus: 'CONFIRMED' } } : t))
      );
    } catch (err) {
      showToast && showToast('Could not confirm trip: ' + err.message, 'error');
    }
  };

  const handleStart = async (tripId) => {
    try {
      await startTrip(tripId);
      showToast && showToast('▶ Trip started! Passenger tracking is now live.', 'success');
      setTrips((prev) =>
        prev.map((t) => (t.trip?.tripId === tripId ? { ...t, trip: { ...t.trip, tripStatus: 'IN_PROGRESS' } } : t))
      );
    } catch (err) {
      showToast && showToast('Could not start trip: ' + err.message, 'error');
    }
  };

  const handleEnd = async (tripId) => {
    try {
      await endTrip(tripId);
      showToast && showToast('🏁 Trip marked as Completed! Passengers will see Destination Reached.', 'success');
      setTrips((prev) =>
        prev.map((t) => (t.trip?.tripId === tripId ? { ...t, trip: { ...t.trip, tripStatus: 'COMPLETED' } } : t))
      );
    } catch (err) {
      showToast && showToast('Could not complete trip: ' + err.message, 'error');
    }
  };

  const handleUpdateLoc = async (tripId, lat, lng, status, nextStop) => {
    await updateLocation(tripId, lat, lng, status, nextStop, providerId);
  };

  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();

  // Filter trips by category, bus number, and date
  const filteredTrips = trips.filter((item) => {
    const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
    const tripId = item?.trip?.tripId || item?.tripId || item?.id;
    const currentStatus = (statuses[tripId] || item?.trip?.tripStatus || item?.status || 'SCHEDULED').toUpperCase();

    // Cancelled trips should never appear in Confirm Trips
    if (currentStatus === 'CANCELLED') return false;

    // Strict alignment with BusFleetManagement: only display trips belonging to assigned coaches
    if (fleetBuses.length > 0) {
      const tPlate = cleanCode(item?.vehicle?.vehicleNumber || item?.schedule?.vehicleNumber || item?.trip?.vehicleId);
      const tName = cleanName(item?.vehicle?.busName || item?.schedule?.busName);
      const tId = cleanCode(tripId);

      const belongsToFleet = fleetBuses.some((fb) => {
        const fp = cleanCode(fb.vehicleNumber);
        const fi = cleanCode(fb.vehicleId || fb.id);
        const fn = cleanName(fb.busName);
        return (fp && tPlate === fp) || (fi && tPlate === fi) || (fn && tName === fn) || (fp && tId.includes(fp));
      });
      if (!belongsToFleet) return false;
    }

    // 1. Category filter
    if (category !== 'All') {
      if (category === 'Completed' && currentStatus !== 'COMPLETED') return false;
      if (category === 'On Going' && !(currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING' || currentStatus === 'ONGOING')) return false;
      if (category === 'Pending' && !(currentStatus === 'PENDING' || currentStatus === 'SCHEDULED')) return false;
      if (category === 'Confirmed' && !(currentStatus === 'CONFIRMED')) return false;
    }

    // 2. Bus Number select dropdown filter
    if (busFilter !== 'all') {
      const target = cleanCode(busFilter);
      const plate = cleanCode(item?.vehicle?.vehicleNumber || item?.schedule?.vehicleNumber || item?.trip?.vehicleId);
      const vId = cleanCode(item?.vehicle?.vehicleId || item?.trip?.vehicleId);
      const tId = cleanCode(tripId);
      const matches = (plate && plate.includes(target)) || (vId && vId.includes(target)) || (tId.includes(target));
      if (!matches) return false;
    }

    // 3. Bus Number quick text search query
    if (busSearchQuery && busSearchQuery.trim()) {
      const q = busSearchQuery.trim().toLowerCase();
      const vNum = String(item?.vehicle?.vehicleNumber || item?.schedule?.vehicleNumber || '').toLowerCase();
      const bName = String(item?.vehicle?.busName || item?.schedule?.busName || '').toLowerCase();
      const tId = String(tripId || '').toLowerCase();
      if (!vNum.includes(q) && !bName.includes(q) && !tId.includes(q)) return false;
    }

    // 4. Date filter (from calendar date picker or preset)
    const jDate = (item?.schedule?.journeyDate || '').split('T')[0];

    // For active/scheduled trips, hide past expired dates unless looking at Completed trips or custom date
    if (currentStatus !== 'COMPLETED' && jDate && jDate < todayStr && !specificDate && datePreset !== 'all') {
      return false;
    }

    if (specificDate) {
      if (jDate !== specificDate) return false;
    } else if (datePreset !== 'all') {
      if (datePreset === 'today') {
        if (jDate !== todayStr) return false;
      } else if (datePreset === 'tomorrow') {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const tomStr = tom.toISOString().split('T')[0];
        if (jDate !== tomStr) return false;
      } else if (datePreset === '3days') {
        if (jDate) {
          const now = new Date();
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const parts = jDate.split('-').map(Number);
          const tripMidnight = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]).getTime() : new Date(jDate).getTime();
          const dayDiff = Math.round((tripMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
          if (dayDiff < 0 || dayDiff > 3) return false;
        }
      } else if (datePreset === '7days') {
        if (jDate) {
          const now = new Date();
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const parts = jDate.split('-').map(Number);
          const tripMidnight = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]).getTime() : new Date(jDate).getTime();
          const dayDiff = Math.round((tripMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
          if (dayDiff < 0 || dayDiff > 7) return false;
        }
      } else if (datePreset === '30days') {
        if (jDate) {
          const now = new Date();
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const parts = jDate.split('-').map(Number);
          const tripMidnight = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]).getTime() : new Date(jDate).getTime();
          const dayDiff = Math.round((tripMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
          if (dayDiff < 0 || dayDiff > 30) return false;
        }
      }
    }

    return true;
  });

  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort((a, b) => {
      // 1. PRIORITY 1: TODAY'S BUSES FIRST
      const isTodayA = (a?.schedule?.journeyDate || '').split('T')[0] === todayStr ? 0 : 1;
      const isTodayB = (b?.schedule?.journeyDate || '').split('T')[0] === todayStr ? 0 : 1;
      if (isTodayA !== isTodayB) return isTodayA - isTodayB;

      // 2. Upcoming dates in ascending chronological order
      const dateA = (a?.schedule?.journeyDate || '').split('T')[0];
      const dateB = (b?.schedule?.journeyDate || '').split('T')[0];
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      // 3. Departure times in chronological order
      const timeA = a?.schedule?.departureTime || '';
      const timeB = b?.schedule?.departureTime || '';
      return timeA.localeCompare(timeB);
    });
  }, [filteredTrips, todayStr]);

  if (loading && trips.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
        <p style={{ color: '#475569', fontWeight: 600 }}>Loading assigned trips…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Confirm Trips</h3>
          <p>Verify coach readiness, confirm scheduled round trips, and manage live GPS tracking for assigned fleet buses.</p>
        </div>
        {isLive ? (
          <span className="live-badge"><span className="live-dot" />Live</span>
        ) : (
          <span className="offline-badge">🟢 Local Storage Synchronized</span>
        )}
      </div>

      {/* ── Fleet Management Assigned Coaches Hub Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1.5px solid #bfdbfe',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🚍</span>
            <span style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.94rem' }}>
              Fleet Management Assigned Coaches ({fleetBuses.length} Active {fleetBuses.length === 1 ? 'Coach' : 'Coaches'})
            </span>
          </div>
          <p style={{ margin: '3px 0 8px', fontSize: '0.76rem', color: '#475569' }}>
            Only coaches assigned in Bus Fleet Management operate round-trip corridors. Click a coach to filter trips.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => setBusFilter('all')}
              style={{
                background: busFilter === 'all' ? '#1d4ed8' : '#ffffff',
                color: busFilter === 'all' ? '#ffffff' : '#1e40af',
                border: `1.5px solid ${busFilter === 'all' ? '#1d4ed8' : '#93c5fd'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Fleet Coaches ({fleetBuses.length})
            </button>
            {fleetBuses.map((b) => {
              const bKey = b.vehicleNumber || b.vehicleId;
              const isSel = busFilter === bKey;
              const orig = b.assignedRoute?.originCity || 'Chennai';
              const dest = b.assignedRoute?.destCity || 'Vijayawada';
              return (
                <button
                  key={b.vehicleId || b.id || b.vehicleNumber}
                  type="button"
                  onClick={() => setBusFilter(isSel ? 'all' : bKey)}
                  style={{
                    background: isSel ? '#1d4ed8' : '#ffffff',
                    color: isSel ? '#ffffff' : '#1e40af',
                    border: `1.5px solid ${isSel ? '#1d4ed8' : '#bfdbfe'}`,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                  title={`Filter trips for ${b.busName} (${b.vehicleNumber})`}
                >
                  <span>🚌 {b.vehicleNumber}</span>
                  <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({orig} ↔ {dest})</span>
                  {isSel && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onNavigate('fleet-management')}
            style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#ffffff', borderColor: '#93c5fd', color: '#1e40af', fontWeight: 700 }}
          >
            ⚙️ Manage in Fleet ➔
          </button>
        )}
      </div>

      {/* Category, Bus Number, and Date Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: 20,
        padding: '0.85rem 1.1rem',
        background: 'var(--white, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="tripCategory" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              Category:
            </label>
            <select
              id="tripCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: '1.5px solid #d1d5db',
                background: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1f2937',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Categories</option>
              <option value="Pending">Pending / Scheduled</option>
              <option value="Confirmed">Confirmed Trips</option>
              <option value="On Going">Live / On Going</option>
              <option value="Completed">Completed Trips</option>
            </select>
          </div>

          {/* Filter by Bus Number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="tripBusFilter" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              Coach:
            </label>
            <select
              id="tripBusFilter"
              value={busFilter}
              onChange={(e) => setBusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: '1.5px solid #93c5fd',
                background: '#eff6ff',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#1e40af',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Buses ({uniqueBusNumbers.length})</option>
              {uniqueBusNumbers.map((plate) => (
                <option key={plate} value={plate}>
                  🚍 {plate}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="🔍 Plate..."
              value={busSearchQuery}
              onChange={(e) => setBusSearchQuery(e.target.value)}
              title="Type plate number to filter"
              style={{
                padding: '5px 8px',
                fontSize: '0.8rem',
                border: '1.5px solid #bfdbfe',
                borderRadius: '6px',
                width: '95px',
                outline: 'none',
                background: '#ffffff',
              }}
            />
          </div>

          {/* Quick Date Pills */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'today', label: '🌟 Today' },
              { id: 'tomorrow', label: '🌅 Tomorrow' },
              { id: '3days', label: '📆 Next 3 Days' },
              { id: '7days', label: '🗓️ Next 7 Days' },
              { id: '30days', label: '📅 Next 30 Days' },
              { id: 'all', label: '🌐 All Upcoming' },
            ].map((pill) => {
              const isSelected = datePreset === pill.id && (pill.id !== 'today' || specificDate === todayStr);
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setDatePreset(pill.id);
                    if (pill.id === 'today') {
                      setSpecificDate(todayStr);
                    } else {
                      setSpecificDate('');
                    }
                  }}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: isSelected ? '1.5px solid #10b981' : '1.5px solid #d1d5db',
                    background: isSelected ? '#ecfdf5' : '#ffffff',
                    color: isSelected ? '#065f46' : '#4b5563',
                    cursor: 'pointer',
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Filter by Date Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              id="tripDateFilter"
              value={datePreset}
              onChange={(e) => {
                const val = e.target.value;
                setDatePreset(val);
                if (val === 'today') {
                  setSpecificDate(todayStr);
                } else if (val !== 'custom') {
                  setSpecificDate('');
                }
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: '1.5px solid #10b981',
                background: '#ecfdf5',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#065f46',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="today">🌟 Today Only ({todayStr})</option>
              <option value="tomorrow">🌅 Tomorrow</option>
              <option value="3days">📆 Next 3 Days</option>
              <option value="7days">🗓️ Next 7 Days (1 Week)</option>
              <option value="30days">📅 Next 30 Days (Continuous)</option>
              <option value="all">🌐 All Upcoming Dates (Today First)</option>
              <option value="custom">📅 Pick Date...</option>
            </select>

            {(datePreset === 'custom' || (specificDate && specificDate !== todayStr)) && (
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  if (e.target.value) setDatePreset('custom');
                }}
                style={{
                  padding: '5px 8px',
                  fontSize: '0.82rem',
                  border: '1.5px solid #10b981',
                  borderRadius: '6px',
                  outline: 'none',
                  fontWeight: 600,
                  color: '#065f46',
                  background: '#ffffff',
                }}
              />
            )}
          </div>

          {(category !== 'All' || busFilter !== 'all' || busSearchQuery || (datePreset !== 'today' && datePreset !== 'all') || (specificDate && specificDate !== todayStr)) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setCategory('All');
                setBusFilter('all');
                setBusSearchQuery('');
                setDatePreset('today');
                setSpecificDate(todayStr);
              }}
              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
          Showing <strong>{sortedTrips.length}</strong> of {trips.length} trips
        </div>
      </div>

      {sortedTrips.length === 0 ? (
        <div className="empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚍</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1e293b', fontWeight: 700 }}>
            {category === 'All' ? 'No Assigned Trips Found' : `No trips found in "${category}" category`}
          </h3>
          <p style={{ color: '#64748b', maxWidth: 500, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {category === 'All'
              ? 'Only coaches assigned to permanent corridors in Bus Fleet Management appear in Confirm Trips. Try changing the date filter or assigning buses to corridors.'
              : `There are currently no assigned trips matching the "${category}" filter for the selected date.`}
          </p>
          {onNavigate && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('fleet-management')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', fontWeight: 600 }}
            >
              🚍 Go to Bus Fleet &amp; Routes
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedTrips.map((item, i) => (
            <TripCard
              key={item?.trip?.tripId || item?.id || i}
              item={item}
              onConfirm={handleConfirm}
              onStart={handleStart}
              onEnd={handleEnd}
              onUpdateLocation={handleUpdateLoc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
