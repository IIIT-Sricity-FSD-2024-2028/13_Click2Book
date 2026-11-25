import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { memStorage } from '../store/memoryBridge';
import { navigateTabThunk, showToastThunk } from '../store/actions';
import { fetchSchedulesFromAPI, updateLocalSchedule, deleteLocalSchedule, deletePermanentSchedule, getCancelledSchedules, getApprovedCities, getFleetBuses } from '../services/api';

const STATUS_COLORS = {
  SCHEDULED: '#3b82f6', IN_PROGRESS: '#f59e0b',
  COMPLETED: '#16a34a', DELAYED: '#ef4444', CANCELLED: '#6b7280',
};

const BUS_TYPES = ['Sleeper AC', 'Semi-Sleeper', 'AC Seater', 'Volvo AC', 'Non-AC', 'Luxury'];

/* ─────────────────────────────────────────────────────────────
   Date & Day Formatter: DD MMM YYYY (Day)
   ───────────────────────────────────────────────────────────── */
export function fmtDateWithDay(dateStr) {
  if (!dateStr || dateStr === '—') return '—';
  try {
    let d;
    if (String(dateStr).includes('T')) {
      d = new Date(dateStr);
    } else {
      const parts = String(dateStr).split('-').map(Number);
      if (parts.length === 3) {
        d = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        d = new Date(dateStr);
      }
    }
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getDay()];
    const mName = months[d.getMonth()];
    const dateNum = String(d.getDate()).padStart(2, '0');
    const yr = d.getFullYear();
    return `${dateNum} ${mName} ${yr} (${dayName})`;
  } catch {
    return dateStr;
  }
}

/* ─────────────────────────────────────────────────────────────
   Edit Schedule Modal
   ───────────────────────────────────────────────────────────── */
function EditModal({ trip, onClose, onSaved, showToast }) {
  const today  = new Date().toISOString().split('T')[0];
  const maxDate = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0];
  })();

  const initialStops = Array.isArray(trip.intermediateStops) && trip.intermediateStops.length > 0
    ? trip.intermediateStops
    : trip.via
    ? trip.via.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const [form, setForm] = useState({
    journeyDate: trip.journeyDate && trip.journeyDate !== '—' ? trip.journeyDate : today,
    from:        trip.source      || trip.from || '',
    to:          trip.destination || trip.to   || '',
    via:         trip.via         || '',
    intermediateStops: initialStops,
    dep:         trip.departureTime && trip.departureTime !== '—' ? trip.departureTime : '',
    arr:         trip.arrivalTime  && trip.arrivalTime  !== '—' ? trip.arrivalTime  : '',
    busName:     trip.busName      || '',
    busType:     trip.vehicleType  || trip.busType || '',
    seats:       String(trip.totalSeats || ''),
    fare:        String(trip.fare || ''),
    vehicleNumber: trip.vehicleNumber || '',
    direction:   trip.direction    || 'UP',
    corridorName: trip.corridorName || trip.assignedRoute?.corridorName || '',
    corridorId:   trip.corridorId   || trip.assignedRoute?.corridorId   || '',
  });

  const [newStopInput, setNewStopInput] = useState('');
  const [stopError, setStopError] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const approvedCities = useMemo(() => getApprovedCities(), []);

  const citiesForFrom = useMemo(() => {
    if (form.from && !approvedCities.includes(form.from)) {
      return [form.from, ...approvedCities];
    }
    return approvedCities;
  }, [approvedCities, form.from]);

  const citiesForTo = useMemo(() => {
    if (form.to && !approvedCities.includes(form.to)) {
      return [form.to, ...approvedCities];
    }
    return approvedCities;
  }, [approvedCities, form.to]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  /* Intermediate stop handlers in Edit Modal */
  const handleAddStop = (stopName) => {
    setStopError('');
    const raw = (stopName || newStopInput).trim();
    if (!raw) {
      setStopError('Please enter a station/city name.');
      return;
    }
    if (raw.toLowerCase() === form.from.trim().toLowerCase()) {
      setStopError(`"${raw}" is already the Departure Hub.`);
      return;
    }
    if (raw.toLowerCase() === form.to.trim().toLowerCase()) {
      setStopError(`"${raw}" is already the Destination Hub.`);
      return;
    }
    if ((form.intermediateStops || []).some((s) => s.toLowerCase() === raw.toLowerCase())) {
      setStopError(`"${raw}" is already in intermediate stops.`);
      return;
    }
    const updated = [...(form.intermediateStops || []), raw];
    setForm((f) => ({
      ...f,
      intermediateStops: updated,
      via: updated.join(', '),
    }));
    setNewStopInput('');
  };

  const handleRemoveStop = (idx) => {
    const updated = (form.intermediateStops || []).filter((_, i) => i !== idx);
    setForm((f) => ({
      ...f,
      intermediateStops: updated,
      via: updated.join(', '),
    }));
  };

  const handleMoveStopUp = (idx) => {
    if (idx === 0) return;
    const updated = [...(form.intermediateStops || [])];
    const tmp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = tmp;
    setForm((f) => ({
      ...f,
      intermediateStops: updated,
      via: updated.join(', '),
    }));
  };

  const handleMoveStopDown = (idx) => {
    if (idx >= (form.intermediateStops || []).length - 1) return;
    const updated = [...(form.intermediateStops || [])];
    const tmp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = tmp;
    setForm((f) => ({
      ...f,
      intermediateStops: updated,
      via: updated.join(', '),
    }));
  };

  const validate = () => {
    if (!form.journeyDate)                           return 'Please select a journey date.';
    if (form.journeyDate < today)                    return 'Journey date cannot be in the past.';
    if (form.journeyDate > maxDate)                  return `Max 2 months ahead (${maxDate}).`;
    if (!form.from.trim())                           return 'Please select the departure location.';
    if (!form.to.trim())                             return 'Please select the destination location.';
    if (form.from.toLowerCase() === form.to.toLowerCase()) return 'Departure and destination cannot be the same.';

    if (form.intermediateStops && form.intermediateStops.length > 0) {
      const lowerFrom = form.from.toLowerCase();
      const lowerTo = form.to.toLowerCase();
      for (const st of form.intermediateStops) {
        if (st.toLowerCase() === lowerFrom) return `Intermediate stop "${st}" cannot be the same as Departure hub.`;
        if (st.toLowerCase() === lowerTo) return `Intermediate stop "${st}" cannot be the same as Destination hub.`;
      }
      const uniqueStops = new Set(form.intermediateStops.map((s) => s.toLowerCase()));
      if (uniqueStops.size !== form.intermediateStops.length) {
        return 'Duplicate intermediate stops detected in route sequence.';
      }
    }

    if (!form.dep)                                   return 'Please enter departure time.';
    if (!form.arr)                                   return 'Please enter arrival time.';
    if (!form.busName.trim())                        return 'Please enter the bus name.';
    if (!form.busType)                               return 'Please select a bus type.';
    const seats = parseInt(form.seats, 10);
    if (!form.seats || isNaN(seats) || seats < 1)   return 'Enter valid seat count (min 1).';
    if (seats > 100)                                 return 'Seats cannot exceed 100.';
    const fare = parseInt(form.fare, 10);
    if (!form.fare || isNaN(fare) || fare < 1)      return 'Enter valid fare (min ₹1).';
    return '';
  };

  const handleSave = () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    const effectiveVia = (form.via && form.via.trim())
      ? form.via.trim()
      : ((form.intermediateStops || []).join(', '));

    setLoading(true);
    const ok = updateLocalSchedule(trip.tripId, {
      from:              form.from.trim(),
      to:                form.to.trim(),
      via:               effectiveVia,
      intermediateStops: form.intermediateStops || [],
      dep:               form.dep,
      arr:               form.arr,
      busName:           form.busName.trim(),
      busType:           form.busType,
      seats:             parseInt(form.seats, 10),
      fare:              parseInt(form.fare, 10),
      journeyDate:       form.journeyDate,
      vehicleNumber:     trip.vehicleNumber || form.vehicleNumber,
      direction:         trip.direction || form.direction,
      corridorName:      form.corridorName || trip.corridorName,
      corridorId:        form.corridorId || trip.corridorId,
    });
    setLoading(false);

    if (ok) {
      showToast(`Schedule for ${form.from} → ${form.to} updated successfully! (Assigned corridor synchronized)`, 'success');
      onSaved();
    } else {
      showToast('Could not update — only locally-added schedules can be edited offline.', 'info');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box edit-sched-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <div className="modal-title">✏️ Edit Schedule</div>
            <div className="modal-sub">Trip ID: {trip.tripId}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-scroll">
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

          {/* Assigned Route Corridor Banner */}
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🛣️ Assigned Route Corridor
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532d', marginTop: 2 }}>
                {trip.corridorName || (trip.assignedRoute?.corridorName) || `${form.from} ↔ ${form.to} Corridor`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {trip.direction && (
                <span style={{
                  background: trip.direction === 'UP' ? '#e0f2fe' : '#fef3c7',
                  color: trip.direction === 'UP' ? '#0369a1' : '#b45309',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {trip.direction === 'UP' ? '⬆ UP Leg' : '⬇ DOWN Leg'}
                </span>
              )}
              <span style={{
                background: '#ffffff',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}>
                🚍 {trip.busName} ({trip.vehicleNumber || trip.vehicleType || 'Assigned'})
              </span>
            </div>
          </div>

          {/* Journey Date */}
          <div className="form-group">
            <label className="form-label">Journey Date</label>
            <input
              type="date"
              className="form-control no-icon"
              value={form.journeyDate}
              min={today}
              max={maxDate}
              onChange={set('journeyDate')}
            />
          </div>

          {/* From / To */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From (Departure City)</label>
              <select
                className="form-control no-icon"
                value={form.from}
                onChange={set('from')}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Select Departure City --</option>
                {citiesForFrom.map((c) => (
                  <option key={`edit-from-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">To (Destination City)</label>
              <select
                className="form-control no-icon"
                value={form.to}
                onChange={set('to')}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Select Destination City --</option>
                {citiesForTo.map((c) => (
                  <option key={`edit-to-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intermediate Bus Stops / Stations */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                📍 Intermediate Bus Stops / Stations (Optional)
              </label>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                {(form.intermediateStops || []).length} stops configured
              </span>
            </div>

            {stopError && (
              <div className="alert alert-error" style={{ padding: '4px 8px', fontSize: '0.78rem', marginBottom: '8px' }}>
                ⚠️ {stopError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="text"
                list="edit-sched-cities-dl"
                className="form-control no-icon"
                placeholder="Add stop (e.g. Nayudupeta, Nellore, Kavali)..."
                value={newStopInput}
                onChange={(e) => {
                  setNewStopInput(e.target.value);
                  setStopError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStop(newStopInput);
                  }
                }}
                style={{ fontSize: '0.82rem' }}
              />
              <datalist id="edit-sched-cities-dl">
                {approvedCities.map((c) => (
                  <option key={`edit-dl-${c}`} value={c} />
                ))}
              </datalist>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleAddStop(newStopInput)}
                style={{ padding: '6px 10px', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>

            {(form.intermediateStops || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                {form.intermediateStops.map((stop, idx) => (
                  <div
                    key={`edit-stop-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '5px',
                      padding: '5px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{stop}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveStopUp(idx)}
                        disabled={idx === 0}
                        style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '3px', width: '22px', height: '22px', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: '0.68rem' }}
                        title="Move Earlier"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStopDown(idx)}
                        disabled={idx === form.intermediateStops.length - 1}
                        style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '3px', width: '22px', height: '22px', cursor: idx === form.intermediateStops.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.68rem' }}
                        title="Move Later"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '3px', width: '22px', height: '22px', cursor: 'pointer', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700 }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px', textAlign: 'center' }}>
                No intermediate stops added yet.
              </div>
            )}

            {/* Sequence Diagram */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>Route Sequence: </span>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>{form.from || 'Origin'}</span>
              {(form.intermediateStops || []).map((s, i) => (
                <span key={`seq-${i}`} style={{ color: '#0369a1' }}>
                  {' ➔ '}<strong style={{ color: '#0284c7' }}>{s}</strong>
                </span>
              ))}
              <span style={{ color: '#dc2626', fontWeight: 700 }}>{' ➔ '}{form.to || 'Destination'}</span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>
                Via (Synchronized route corridor string):
              </label>
              <input
                type="text"
                className="form-control no-icon"
                placeholder="e.g. Nayudupeta, Nellore, Kavali (Optional)"
                value={form.via}
                onChange={set('via')}
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Dep / Arr */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Departure Time</label>
              <input
                type="time"
                className="form-control no-icon"
                value={form.dep}
                onChange={set('dep')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Arrival Time</label>
              <input
                type="time"
                className="form-control no-icon"
                value={form.arr}
                onChange={set('arr')}
              />
            </div>
          </div>

          {/* Bus Name */}
          <div className="form-group">
            <label className="form-label">Bus Name</label>
            <input
              type="text"
              className="form-control no-icon"
              placeholder="e.g. Volvo AC"
              value={form.busName}
              onChange={set('busName')}
            />
          </div>

          {/* Bus Type */}
          <div className="form-group">
            <label className="form-label">Bus Type</label>
            <select
              className="form-control no-icon"
              value={form.busType}
              onChange={set('busType')}
            >
              <option value="">-- Select Bus Type --</option>
              {BUS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Seats / Fare */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Seats</label>
              <input
                type="number"
                className="form-control no-icon"
                placeholder="e.g. 40"
                min="1"
                max="100"
                value={form.seats}
                onChange={set('seats')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fare Per Seat (₹)</label>
              <input
                type="number"
                className="form-control no-icon"
                placeholder="e.g. 550"
                min="1"
                value={form.fare}
                onChange={set('fare')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="edit-modal-actions">
            <button className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main ManageSchedules page
   ───────────────────────────────────────────────────────────── */
export default function ManageSchedules() {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.auth.provider);
  const onNavigate = (tab) => dispatch(navigateTabThunk(tab));
  const showToast = (msg, type = 'info') => dispatch(showToastThunk(msg, type));
  const [trips,           setTrips]           = useState([]);
  const [cancelledTrips,  setCancelledTrips]  = useState([]);
  const [isLive,          setIsLive]          = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [editTrip,        setEditTrip]        = useState(null); // trip being edited
  const [activeTab,       setActiveTab]       = useState('schedules'); // 'schedules' | 'completed' | 'cancelled'
  const [dateFilter,      setDateFilter]      = useState('all'); // 'all' | '1day' | '2days' | '3days' | 'custom'
  const [customDays,      setCustomDays]      = useState('5');
  const [cityFilter,          setCityFilter]          = useState('all'); // filter active schedules by approved city hub
  const [busFilter,           setBusFilter]           = useState('all'); // filter active schedules by assigned bus from BusFleetManagement
  const [busSearchQuery,      setBusSearchQuery]      = useState('');    // quick search by bus plate number
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [upcomingWindowFilter, setUpcomingWindowFilter] = useState('today'); // Default to Today
  const [specificDateFilter,  setSpecificDateFilter]  = useState(new Date().toISOString().split('T')[0]);

  const approvedCities = useMemo(() => getApprovedCities(), []);

  // Fleet buses from BusFleetManagement — this is the single source of truth for assigned fleet
  const fleetBuses = useMemo(() => {
    try {
      const all = getFleetBuses(provider?.id) || [];
      return all.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);
    } catch {
      return [];
    }
  }, [provider?.id, trips]);

  const loadTrips = (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    fetchSchedulesFromAPI(provider?.id).then(({ data, isLive: live }) => {
      setTrips(data);
      setIsLive(live);
      setCancelledTrips(getCancelledSchedules());
      setLoading(false);
    });
  };

  useEffect(() => {
    loadTrips(true);
  }, [provider?.id]);

  // Sync silently when window refocuses or storage updates (no aggressive polling or spinner flashing)
  useEffect(() => {
    const handleSync = () => { loadTrips(false); };
    window.addEventListener('storage', handleSync);
    window.addEventListener('c2b_sync', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('c2b_sync', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [provider?.id]);

  const handleSaved = () => {
    setEditTrip(null);
    loadTrips(); // refresh list after save
    try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULE_SAVED' } })); } catch {}
    try { window.dispatchEvent(new Event('storage')); } catch {}
  };

  // Delete/Cancel Trip handler
  const handleDeleteTrip = (t) => {
    const statuses = JSON.parse(memStorage.getItem('c2b_trip_statuses') || '{}');
    const curStatus = statuses[t.tripId] || t.status || 'SCHEDULED';

    if (curStatus === 'IN_PROGRESS') {
      showToast('Cannot cancel trip! This trip has already started and is in progress.', 'error');
      return;
    }
    if (curStatus === 'COMPLETED') {
      showToast('Cannot cancel trip! This trip has already ended/completed.', 'error');
      return;
    }
    if (curStatus === 'CANCELLED') {
      showToast('This trip is already cancelled.', 'info');
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel the schedule for "${t.busName}" (${t.source} → ${t.destination})? It will be moved to Cancelled Schedules.`)) {
      return;
    }

    const ok = deleteLocalSchedule(t.tripId, {
      source:        t.source,
      destination:   t.destination,
      via:           t.via,
      departureTime: t.departureTime,
      arrivalTime:   t.arrivalTime,
      journeyDate:   t.journeyDate,
      busName:       t.busName,
      vehicleType:   t.vehicleType,
      totalSeats:    t.totalSeats,
      fare:          t.fare,
    });
    if (ok) {
      showToast('Schedule for ' + t.source + ' to ' + t.destination + ' has been cancelled and moved to Cancelled Schedules.', 'success');
      loadTrips();
      setActiveTab('cancelled');
    } else {
      showToast('Failed to cancel schedule.', 'error');
    }
  };

  // Permanently Delete Schedule handler (completely removes from system)
  const handlePermanentDelete = (tripId) => {
    if (!window.confirm('Are you sure you want to permanently delete this cancelled schedule? It cannot be recovered.')) {
      return;
    }
    const ok = deletePermanentSchedule(tripId);
    if (ok) {
      showToast('Schedule permanently deleted.', 'success');
      loadTrips();
    } else {
      showToast('Failed to delete schedule.', 'error');
    }
  };

  // Clear all cancelled schedules
  const handleClearAllCancelled = () => {
    if (!window.confirm(`Are you sure you want to permanently clear all ${cancelledTrips.length} cancelled schedules?`)) {
      return;
    }
    cancelledTrips.forEach((t) => deletePermanentSchedule(t.tripId));
    showToast('All cancelled schedules permanently deleted.', 'success');
    loadTrips();
  };

  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Split into active schedules vs completed trips, strictly belonging to fleet buses from BusFleetManagement
  const activeTrips = useMemo(() => {
    return trips.filter((t) => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      const jDate = (t.journeyDate || '').split('T')[0];
      if (jDate && jDate < todayStr) return false; // Strictly today and future trips!
      if (fleetBuses.length === 0) return true;
      const tPlate = cleanCode(t.vehicleNumber);
      const tId = cleanCode(t.vehicleId);
      const tTripId = cleanCode(t.tripId);
      const tName = String(t.busName || '').toLowerCase().trim();

      return fleetBuses.some((b) => {
        const bp = cleanCode(b.vehicleNumber);
        const bi = cleanCode(b.vehicleId || b.id);
        const bn = String(b.busName || '').toLowerCase().trim();
        return (bp && tPlate === bp) || (bi && tId === bi) || (bp && tTripId.includes(bp)) || (bn && tName === bn);
      });
    });
  }, [trips, fleetBuses, todayStr]);

  const completedTrips = useMemo(() => {
    return trips.filter((t) => {
      const jDate = (t.journeyDate || '').split('T')[0];
      const isPastOrDone = t.status === 'COMPLETED' || (jDate && jDate < todayStr);
      if (!isPastOrDone || t.status === 'CANCELLED') return false;
      if (fleetBuses.length === 0) return true;
      const tPlate = cleanCode(t.vehicleNumber);
      const tId = cleanCode(t.vehicleId);
      const tTripId = cleanCode(t.tripId);
      const tName = String(t.busName || '').toLowerCase().trim();

      return fleetBuses.some((b) => {
        const bp = cleanCode(b.vehicleNumber);
        const bi = cleanCode(b.vehicleId || b.id);
        const bn = String(b.busName || '').toLowerCase().trim();
        return (bp && tPlate === bp) || (bi && tId === bi) || (bp && tTripId.includes(bp)) || (bn && tName === bn);
      });
    });
  }, [trips, fleetBuses, todayStr]);

  // Filter active trips by approved city corridor, assigned bus coach, search query, and upcoming schedule window
  const filteredActive = activeTrips.filter((t) => {
    // 1. Specific Date filter (from date picker or preset)
    if (specificDateFilter) {
      const tripDate = (t.journeyDate || '').split('T')[0];
      if (tripDate !== specificDateFilter) return false;
    } else if (upcomingWindowFilter !== 'all') {
      const tripDate = (t.journeyDate || '').split('T')[0];
      if (tripDate && tripDate !== '—') {
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const parts = tripDate.split('-').map(Number);
        const tripMidnight = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]).getTime() : new Date(tripDate).getTime();
        const dayDiff = Math.round((tripMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

        if (upcomingWindowFilter === 'today' && dayDiff !== 0) return false;
        if (upcomingWindowFilter === 'tomorrow' && dayDiff !== 1) return false;
        if (upcomingWindowFilter === '3days' && (dayDiff < 0 || dayDiff > 3)) return false;
        if (upcomingWindowFilter === '7days' && (dayDiff < 0 || dayDiff > 7)) return false;
        if (upcomingWindowFilter === '14days' && (dayDiff < 0 || dayDiff > 14)) return false;
        if (upcomingWindowFilter === '30days' && (dayDiff < 0 || dayDiff > 30)) return false;
      }
    }

    // 2. Bus Number select dropdown filter
    if (busFilter !== 'all') {
      const tPlate = cleanCode(t.vehicleNumber);
      const tId = cleanCode(t.vehicleId);
      const tTripId = cleanCode(t.tripId);
      const target = cleanCode(busFilter);
      const busMatch = (tPlate && (tPlate === target || tPlate.includes(target))) ||
                       (tId && (tId === target || tId.includes(target))) ||
                       (tTripId && tTripId.includes(target));
      if (!busMatch) return false;
    }

    // 3. Bus Number text search query
    if (busSearchQuery && busSearchQuery.trim()) {
      const q = busSearchQuery.trim().toLowerCase();
      const matchPlate = String(t.vehicleNumber || '').toLowerCase().includes(q);
      const matchName = String(t.busName || '').toLowerCase().includes(q);
      const matchTripId = String(t.tripId || '').toLowerCase().includes(q);
      if (!matchPlate && !matchName && !matchTripId) return false;
    }

    // 4. City Hub filter
    if (cityFilter === 'all') return true;
    const c = cityFilter.toLowerCase();
    const inSource = t.source && t.source.toLowerCase() === c;
    const inDest = t.destination && t.destination.toLowerCase() === c;
    const inStops = Array.isArray(t.intermediateStops) && t.intermediateStops.some((s) => s.toLowerCase() === c);
    const inVia = typeof t.via === 'string' && t.via.toLowerCase().includes(c);
    return inSource || inDest || inStops || inVia;
  });

  const sortedActive = [...filteredActive].sort((a, b) => {
    const isTodayA = (a.journeyDate || '').split('T')[0] === todayStr ? 0 : 1;
    const isTodayB = (b.journeyDate || '').split('T')[0] === todayStr ? 0 : 1;
    if (isTodayA !== isTodayB) return isTodayA - isTodayB;

    const dateA = a.journeyDate || '';
    const dateB = b.journeyDate || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const timeA = a.departureTime || '';
    const timeB = b.departureTime || '';
    return timeA.localeCompare(timeB);
  });

  // Calculate calendar days difference between today and a trip's completion/journey date
  const getDaysAgo = (dateStr) => {
    if (!dateStr || dateStr === '—') return null;
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let targetMidnight;
    if (String(dateStr).includes('T')) {
      const d = new Date(dateStr);
      targetMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    } else {
      const parts = String(dateStr).split('-').map(Number);
      if (parts.length === 3) {
        targetMidnight = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
      } else {
        const d = new Date(dateStr);
        targetMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }
    }

    if (isNaN(targetMidnight)) return null;
    return Math.round((todayMidnight - targetMidnight) / (1000 * 60 * 60 * 24));
  };

  // Filter completed trips by last 1, 2, 3 days or custom N days
  const filteredCompleted = completedTrips.filter((t) => {
    if (dateFilter === 'all') return true;

    const dateStr = t.completedAt || t.journeyDate;
    const daysAgo = getDaysAgo(dateStr);
    if (daysAgo === null) return true;

    let maxDays;
    if (dateFilter === '1day') {
      maxDays = 1;
    } else if (dateFilter === '2days') {
      maxDays = 2;
    } else if (dateFilter === '3days') {
      maxDays = 3;
    } else if (dateFilter === 'custom') {
      const n = parseInt(customDays, 10);
      maxDays = !isNaN(n) && n >= 0 ? n : 0;
    } else {
      return true;
    }

    return daysAgo <= maxDays;
  });

  if (loading && trips.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: '4rem' }}>
        <p>⏳ Loading schedules…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Manage Schedules</h3>
          <p style={{ marginTop: 4 }}>
            {isLive ? (
              <span className="live-badge"><span className="live-dot" />Live — {activeTrips.length} active schedules</span>
            ) : (
              <span className="offline-badge">🟡 Offline — {activeTrips.length} active schedules</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => onNavigate('fleet-management')}>
            🚍 Manage Fleet &amp; Schedules
          </button>
        </div>
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
            Bus Fleet Management is the single center for coach registration and corridor assignment. Only assigned coaches operate continuous round-trip schedules.
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
                  title={`View schedules for ${b.busName} (${b.vehicleNumber})`}
                >
                  <span>🚌 {b.vehicleNumber}</span>
                  <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({orig} ↔ {dest})</span>
                  {isSel && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onNavigate('fleet-management')}
          style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#ffffff', borderColor: '#93c5fd', color: '#1e40af', fontWeight: 700 }}
        >
          ⚙️ Manage in Fleet ➔
        </button>
      </div>

      {/* Tabs and Filters Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '1.25rem',
        padding: '0.75rem 1rem',
        background: '#ffffff',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'schedules' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '7px 16px', fontSize: '0.85rem', fontWeight: 600 }}
            onClick={() => setActiveTab('schedules')}
          >
            📋 Active Schedules ({activeTrips.length})
          </button>
          <button
            className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '7px 16px', fontSize: '0.85rem', fontWeight: 600 }}
            onClick={() => setActiveTab('completed')}
          >
            🏁 Completed Trips ({completedTrips.length})
          </button>
          <button
            className={`btn ${activeTab === 'cancelled' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '7px 16px', fontSize: '0.85rem', fontWeight: 600, borderColor: activeTab === 'cancelled' ? undefined : '#fca5a5', color: activeTab === 'cancelled' ? undefined : '#dc2626' }}
            onClick={() => setActiveTab('cancelled')}
          >
            🚫 Cancelled ({cancelledTrips.length})
          </button>
        </div>

        {activeTab === 'schedules' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter by Bus Number */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="activeBusFilter" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                Bus Number:
              </label>
              <select
                id="activeBusFilter"
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
                <option value="all">All Bus Numbers ({fleetBuses.length} Buses)</option>
                {fleetBuses.map((b) => (
                  <option key={b.vehicleId || b.id || b.vehicleNumber} value={b.vehicleNumber || b.vehicleId}>
                    🚍 {b.vehicleNumber} {b.busName ? `· ${b.busName}` : ''} ({b.assignedRoute?.originCity || 'Origin'} ↔ {b.assignedRoute?.destCity || 'Dest'})
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
                const isSelected = upcomingWindowFilter === pill.id && (pill.id !== 'today' || specificDateFilter === todayStr);
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setUpcomingWindowFilter(pill.id);
                      if (pill.id === 'today') {
                        setSpecificDateFilter(todayStr);
                      } else {
                        setSpecificDateFilter('');
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

            {/* Filter by Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                id="upcomingWindowFilter"
                value={upcomingWindowFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setUpcomingWindowFilter(val);
                  if (val === 'today') {
                    setSpecificDateFilter(todayStr);
                  } else if (val !== 'custom') {
                    setSpecificDateFilter('');
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

              {(upcomingWindowFilter === 'custom' || (specificDateFilter && specificDateFilter !== todayStr)) && (
                <input
                  type="date"
                  value={specificDateFilter}
                  onChange={(e) => {
                    setSpecificDateFilter(e.target.value);
                    if (e.target.value) setUpcomingWindowFilter('custom');
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="activeCityFilter" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                City Hub:
              </label>
              <select
                id="activeCityFilter"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1.5px solid #d1d5db',
                  background: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#1f2937',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">All Accessible Hubs ({approvedCities.length} cities)</option>
                {approvedCities.map((c) => (
                  <option key={`hub-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(cityFilter !== 'all' || busFilter !== 'all' || busSearchQuery || specificDateFilter || upcomingWindowFilter !== 'all') && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setCityFilter('all');
                  setBusFilter('all');
                  setBusSearchQuery('');
                  setSpecificDateFilter('');
                  setUpcomingWindowFilter('all');
                }}
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="completedDateFilter" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                Filter by Date :
              </label>
              <select
                id="completedDateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
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
                <option value="all">All Completed ({completedTrips.length})</option>
                <option value="1day">Last 1 Day</option>
                <option value="2days">Last 2 Days</option>
                <option value="3days">Last 3 Days</option>
                <option value="custom">Custom (Last N Days)</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', padding: '4px 10px', borderRadius: '7px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e40af' }}>Last:</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="e.g. 5"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  style={{
                    width: '65px',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    border: '1.5px solid #3b82f6',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e40af' }}>days</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Active Schedules View ── */}
      {activeTab === 'schedules' && (
        sortedActive.length === 0 ? (
          <div className="empty-state">
            <p>
              {cityFilter === 'all'
                ? 'No active schedules found.'
                : `No active schedules found connecting "${cityFilter}".`}
              {cityFilter !== 'all' && (
                <button
                  className="btn btn-outline"
                  onClick={() => setCityFilter('all')}
                  style={{ display: 'inline-flex', marginLeft: 8 }}
                >
                  Show All Cities
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('fleet-management')}
                style={{ display: 'inline-flex', marginLeft: 8 }}
              >
                🚍 Schedule in Fleet
              </button>
            </p>
          </div>
        ) : (
          <div className="schedule-list">
            {sortedActive.map((t, i) => {
              const avail     = parseInt(t.availableSeats) || 0;
              const total     = parseInt(t.totalSeats) || 1;
              const pct       = Math.round((avail / total) * 100);
              const barColor  = pct > 60 ? '#16a34a' : pct > 30 ? '#f59e0b' : '#ef4444';
              const stCol     = STATUS_COLORS[t.status] || '#6b7280';
              const isLocal   = !!t.isNew;
              const hasStarted = t.status === 'IN_PROGRESS';
              const canDelete = !hasStarted;
              const isToday   = (t.journeyDate || '').split('T')[0] === todayStr;

              return (
                <div
                  key={t.tripId || i}
                  className="list-card"
                  style={{ borderLeftColor: barColor }}
                >
                  <div className="card-meta-row" style={{ flex: 1 }}>
                    <div className="card-route" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800 }}>{t.source} → {t.destination}</span>
                      <span
                        style={{
                          background: isToday ? '#dcfce7' : '#f0fdf4',
                          color: isToday ? '#15803d' : '#166534',
                          border: `1.5px solid ${isToday ? '#86efac' : '#bbf7d0'}`,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isToday ? '🌟 Today · ' : '📅 '}
                        {fmtDateWithDay(t.journeyDate)}
                      </span>
                      <span
                        style={{
                          background: t.direction === 'DOWN' ? '#fef3c7' : '#dbeafe',
                          color: t.direction === 'DOWN' ? '#92400e' : '#1e40af',
                          border: `1px solid ${t.direction === 'DOWN' ? '#fcd34d' : '#bfdbfe'}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                        }}
                      >
                        {t.direction === 'DOWN' ? 'DOWN (Return)' : 'UP (Outbound)'}
                      </span>
                      {t.corridorName && (
                        <span
                          style={{
                            background: '#f1f5f9',
                            color: '#1e293b',
                            border: '1px solid #cbd5e1',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                          title={t.corridorName}
                        >
                          🛣️ {t.corridorName}
                        </span>
                      )}
                      {Array.isArray(t.intermediateStops) && t.intermediateStops.length > 0 ? (
                        <span
                          className="via-tag"
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                          title={`Intermediate stops: ${t.intermediateStops.join(' ➔ ')}`}
                        >
                          📍 {t.intermediateStops.length} Intermediate {t.intermediateStops.length === 1 ? 'Stop' : 'Stops'}: {t.intermediateStops.join(' ➔ ')}
                        </span>
                      ) : t.via ? (
                        <span className="via-tag">Via: {t.via}</span>
                      ) : null}
                      {t.isNew && <span className="new-tag">NEW</span>}
                    </div>
                    <div className="card-time">
                      {t.departureTime} → {t.arrivalTime} · <strong>{t.busName}</strong> · {t.vehicleType}
                    </div>
                    <div className="card-id">
                      Trip: {t.tripId} · {fmtDateWithDay(t.journeyDate)} ({t.dayOfWeek || 'Daily'}) · Coach: <strong>{t.vehicleNumber || '—'}</strong> ·{' '}
                      <span style={{ color: stCol, fontWeight: 700 }}>{t.status}</span>
                    </div>
                  </div>
                  <div className="card-right-info">
                    <div className="card-seats" style={{ color: barColor }}>
                      {t.availableSeats}/{t.totalSeats} seats
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        title={isLocal ? 'Edit this schedule' : 'Only locally-added schedules can be edited offline'}
                        onClick={() => {
                          if (isLocal) {
                            setEditTrip(t);
                          } else {
                            showToast('Live API schedules can only be edited via the backend dashboard.', 'info');
                          }
                        }}
                      >
                        ✏ Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          color: canDelete ? '#ef4444' : '#9ca3af',
                          borderColor: canDelete ? '#fca5a5' : '#e5e7eb',
                          cursor: canDelete ? 'pointer' : 'not-allowed',
                          opacity: canDelete ? 1 : 0.6,
                        }}
                        title={canDelete ? 'Delete this schedule' : 'Cannot delete a trip that has already started'}
                        onClick={() => handleDeleteTrip(t)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                    {hasStarted && (
                      <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                        ● In Progress (Cannot delete)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Completed Trips View ── */}
      {activeTab === 'completed' && (
        filteredCompleted.length === 0 ? (
          <div className="empty-state">
            <p>
              {completedTrips.length === 0
                ? 'No completed trips yet. Trips move here automatically once marked as completed in Confirm Trips.'
                : dateFilter === 'custom'
                ? `No completed trips found within the last ${customDays || 0} days.`
                : `No completed trips found for "${dateFilter === 'all' ? 'All' : `Last ${dateFilter.replace('days', ' Days').replace('1day', '1 Day')}`}".`}
            </p>
          </div>
        ) : (
          <div className="schedule-list">
            {filteredCompleted.map((t, i) => {
              const bookedPax = t.bookedSeats || Math.max(0, (t.totalSeats || 0) - (t.availableSeats || 0));
              const revenue = t.revenue || (bookedPax * (t.fare || 0));
              const daysAgo = getDaysAgo(t.completedAt || t.journeyDate);
              const daysLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : daysAgo !== null ? `${daysAgo} days ago` : '';

              return (
                <div
                  key={t.tripId || i}
                  className="list-card"
                  style={{ borderLeftColor: '#16a34a', background: '#fcfdfd' }}
                >
                  <div className="card-meta-row" style={{ flex: 1 }}>
                    <div className="card-route" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t.source} → {t.destination}</span>
                      {Array.isArray(t.intermediateStops) && t.intermediateStops.length > 0 ? (
                        <span
                          className="via-tag"
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                          title={`Intermediate stops: ${t.intermediateStops.join(' ➔ ')}`}
                        >
                          📍 {t.intermediateStops.length} Stops: {t.intermediateStops.join(' ➔ ')}
                        </span>
                      ) : t.via ? (
                        <span className="via-tag">Via: {t.via}</span>
                      ) : null}
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>✓ Completed</span>
                      {daysLabel && (
                        <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          ⏱ {daysLabel}
                        </span>
                      )}
                    </div>

                    <div className="card-time" style={{ marginTop: 4 }}>
                      🚌 <strong>{t.busName}</strong> · <span style={{ color: '#4b5563' }}>{t.vehicleType}</span> · Dep: {t.departureTime} → Arr: {t.arrivalTime}
                    </div>

                    <div className="card-id" style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                      <span><strong>Trip ID:</strong> {t.tripId}</span>
                      <span><strong>Journey Date:</strong> {t.journeyDate}</span>
                      {t.completedAt && (
                        <span><strong>Completed At:</strong> {new Date(t.completedAt).toLocaleString()}</span>
                      )}
                    </div>

                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#374151', display: 'flex', gap: '16px', flexWrap: 'wrap', background: '#f3f4f6', padding: '6px 10px', borderRadius: '6px' }}>
                      <span>👥 <strong>Passengers:</strong> {bookedPax}/{t.totalSeats} seats</span>
                      <span>🎟 <strong>Fare:</strong> ₹{t.fare} / seat</span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>💰 <strong>Revenue:</strong> ₹{revenue}</span>
                    </div>
                  </div>

                  <div className="card-right-info" style={{ textAlign: 'right' }}>
                    <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem' }}>
                      🏁 Trip Ended
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                      Destination Reached
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Cancelled Schedules View ── */}
      {activeTab === 'cancelled' && (
        cancelledTrips.length === 0 ? (
          <div className="empty-state">
            <p>No cancelled schedules yet. When you cancel a scheduled trip, it will appear here.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Showing {cancelledTrips.length} cancelled {cancelledTrips.length === 1 ? 'schedule' : 'schedules'}. Permanently delete to remove from records.
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px 12px', fontSize: '0.78rem' }}
                onClick={handleClearAllCancelled}
              >
                🗑 Clear All Cancelled
              </button>
            </div>
            <div className="schedule-list">
              {cancelledTrips.slice().reverse().map((t, i) => (
                <div
                  key={t.tripId || i}
                  className="list-card"
                  style={{ borderLeftColor: '#6b7280', background: '#fafafa', opacity: 0.95 }}
                >
                  <div className="card-meta-row" style={{ flex: 1 }}>
                    <div className="card-route" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151' }}>{t.source} → {t.destination}</span>
                      {t.via && <span className="via-tag">Via: {t.via}</span>}
                      <span style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #e5e7eb' }}>🚫 Cancelled</span>
                    </div>
                    <div className="card-time" style={{ marginTop: 4, color: '#6b7280' }}>
                      🚌 <strong>{t.busName}</strong> · <span>{t.vehicleType}</span> · Dep: {t.departureTime} → Arr: {t.arrivalTime}
                    </div>
                    <div className="card-id" style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '14px', color: '#9ca3af' }}>
                      <span><strong>Trip ID:</strong> {t.tripId}</span>
                      <span><strong>Journey Date:</strong> {t.journeyDate}</span>
                      <span><strong>Seats:</strong> {t.totalSeats}</span>
                      <span><strong>Fare:</strong> ₹{t.fare}</span>
                      {t.cancelledAt && (
                        <span><strong>Cancelled At:</strong> {new Date(t.cancelledAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="card-right-info" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ color: '#6b7280', fontWeight: 700, fontSize: '0.9rem' }}>🚫 Cancelled</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Schedule Removed</div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600 }}
                      onClick={() => handlePermanentDelete(t.tripId)}
                      title="Permanently delete this schedule record"
                    >
                      🗑 Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Edit Modal */}
      {editTrip && (
        <EditModal
          trip={editTrip}
          onClose={() => setEditTrip(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
    </div>
  );
}
