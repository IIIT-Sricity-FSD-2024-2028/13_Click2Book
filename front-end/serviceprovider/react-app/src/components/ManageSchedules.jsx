import React, { useState, useEffect } from 'react';
import { fetchSchedulesFromAPI, updateLocalSchedule, deleteLocalSchedule } from '../services/api';

const STATUS_COLORS = {
  SCHEDULED: '#3b82f6', IN_PROGRESS: '#f59e0b',
  COMPLETED: '#16a34a', DELAYED: '#ef4444', CANCELLED: '#6b7280',
};

const BUS_TYPES = ['Sleeper AC', 'Semi-Sleeper', 'AC Seater', 'Volvo AC', 'Non-AC', 'Luxury'];

/* ─────────────────────────────────────────────────────────────
   Edit Schedule Modal
   ───────────────────────────────────────────────────────────── */
function EditModal({ trip, onClose, onSaved, showToast }) {
  const today  = new Date().toISOString().split('T')[0];
  const maxDate = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0];
  })();

  const [form, setForm] = useState({
    journeyDate: trip.journeyDate && trip.journeyDate !== '—' ? trip.journeyDate : today,
    from:        trip.source      || '',
    to:          trip.destination || '',
    via:         trip.via         || '',
    dep:         trip.departureTime && trip.departureTime !== '—' ? trip.departureTime : '',
    arr:         trip.arrivalTime  && trip.arrivalTime  !== '—' ? trip.arrivalTime  : '',
    busName:     trip.busName      || '',
    busType:     trip.vehicleType  || '',
    seats:       String(trip.totalSeats || ''),
    fare:        String(trip.fare || ''),
  });

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.journeyDate)                           return 'Please select a journey date.';
    if (form.journeyDate < today)                    return 'Journey date cannot be in the past.';
    if (form.journeyDate > maxDate)                  return `Max 2 months ahead (${maxDate}).`;
    if (!form.from.trim())                           return 'Please enter the departure location.';
    if (/^\d+$/.test(form.from))                     return 'Departure cannot be only numbers.';
    if (!form.to.trim())                             return 'Please enter the destination location.';
    if (/^\d+$/.test(form.to))                       return 'Destination cannot be only numbers.';
    if (form.from.toLowerCase() === form.to.toLowerCase()) return 'Departure and destination cannot be the same.';
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

    setLoading(true);
    const ok = updateLocalSchedule(trip.tripId, {
      from:        form.from.trim(),
      to:          form.to.trim(),
      via:         form.via.trim(),
      dep:         form.dep,
      arr:         form.arr,
      busName:     form.busName.trim(),
      busType:     form.busType,
      seats:       parseInt(form.seats, 10),
      fare:        parseInt(form.fare, 10),
      journeyDate: form.journeyDate,
    });
    setLoading(false);

    if (ok) {
      showToast(`Schedule for ${form.from} → ${form.to} updated successfully!`, 'success');
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
              <label className="form-label">From</label>
              <input
                type="text"
                className="form-control no-icon"
                placeholder="e.g. Pune"
                value={form.from}
                onChange={set('from')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input
                type="text"
                className="form-control no-icon"
                placeholder="e.g. Mumbai"
                value={form.to}
                onChange={set('to')}
              />
            </div>
          </div>

          {/* Via */}
          <div className="form-group">
            <label className="form-label">Via (Optional)</label>
            <input
              type="text"
              className="form-control no-icon"
              placeholder="e.g. Lonavala (Optional)"
              value={form.via}
              onChange={set('via')}
            />
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
export default function ManageSchedules({ onNavigate, showToast }) {
  const [trips,           setTrips]           = useState([]);
  const [isLive,          setIsLive]          = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [editTrip,        setEditTrip]        = useState(null); // trip being edited
  const [activeTab,       setActiveTab]       = useState('schedules'); // 'schedules' | 'completed'
  const [dateFilter,      setDateFilter]      = useState('all'); // 'all' | '1day' | '2days' | '3days' | 'custom'
  const [customDays,      setCustomDays]      = useState('5');

  const loadTrips = () => {
    setLoading(true);
    fetchSchedulesFromAPI().then(({ data, isLive: live }) => {
      setTrips(data);
      setIsLive(live);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // Sync when window refocuses or storage updates
  useEffect(() => {
    const handleSync = () => { loadTrips(); };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const handleSaved = () => {
    setEditTrip(null);
    loadTrips(); // refresh list after save
  };

  // Delete Trip handler
  const handleDeleteTrip = (t) => {
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const curStatus = statuses[t.tripId] || t.status || 'SCHEDULED';

    if (curStatus === 'IN_PROGRESS') {
      showToast('⚠️ Cannot delete trip! This trip has already started and is in progress.', 'error');
      return;
    }
    if (curStatus === 'COMPLETED') {
      showToast('⚠️ Cannot delete trip! This trip has already ended/completed.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the schedule for "${t.busName}" (${t.source} → ${t.destination})?`)) {
      return;
    }

    const ok = deleteLocalSchedule(t.tripId);
    if (ok) {
      showToast(`🗑 Schedule for ${t.source} → ${t.destination} deleted successfully!`, 'success');
      loadTrips();
    } else {
      showToast('Failed to delete schedule.', 'error');
    }
  };

  // Split into active schedules vs completed trips
  const activeTrips = trips.filter((t) => t.status !== 'COMPLETED');
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED');

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

  if (loading) {
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
              <span className="live-badge"><span className="live-dot" />Live — {trips.length} total trips</span>
            ) : (
              <span className="offline-badge">🟡 Offline — {trips.length} total trips</span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('add-schedule')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New
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
        </div>

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
        activeTrips.length === 0 ? (
          <div className="empty-state">
            <p>No active schedules found. <button className="btn btn-primary" onClick={() => onNavigate('add-schedule')} style={{ display: 'inline-flex', marginLeft: 8 }}>+ Add one</button></p>
          </div>
        ) : (
          <div className="schedule-list">
            {activeTrips.map((t, i) => {
              const avail     = parseInt(t.availableSeats) || 0;
              const total     = parseInt(t.totalSeats) || 1;
              const pct       = Math.round((avail / total) * 100);
              const barColor  = pct > 60 ? '#16a34a' : pct > 30 ? '#f59e0b' : '#ef4444';
              const stCol     = STATUS_COLORS[t.status] || '#6b7280';
              const isLocal   = !!t.isNew;
              const hasStarted = t.status === 'IN_PROGRESS';
              const canDelete = !hasStarted;

              return (
                <div
                  key={t.tripId || i}
                  className="list-card"
                  style={{ borderLeftColor: barColor }}
                >
                  <div className="card-meta-row" style={{ flex: 1 }}>
                    <div className="card-route">
                      {t.source} → {t.destination}
                      {t.via && <span className="via-tag">Via: {t.via}</span>}
                      {t.isNew && <span className="new-tag">NEW</span>}
                    </div>
                    <div className="card-time">
                      {t.departureTime} → {t.arrivalTime} · <strong>{t.busName}</strong> · {t.vehicleType}
                    </div>
                    <div className="card-id">
                      Trip: {t.tripId} · Date: {t.journeyDate} ·{' '}
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
                      {t.via && <span className="via-tag">Via: {t.via}</span>}
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
