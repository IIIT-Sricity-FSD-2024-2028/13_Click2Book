import React, { useState, useEffect } from 'react';
import { fetchSchedulesFromAPI, updateLocalSchedule } from '../services/api';

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
  const [trips,     setTrips]     = useState([]);
  const [isLive,    setIsLive]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [editTrip,  setEditTrip]  = useState(null); // trip being edited

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

  const handleSaved = () => {
    setEditTrip(null);
    loadTrips(); // refresh list after save
  };

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
              <span className="live-badge"><span className="live-dot" />Live — {trips.length} trips</span>
            ) : (
              <span className="offline-badge">🟡 Offline — {trips.length} local trips</span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('add-schedule')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <p>No schedules found. <button className="btn btn-primary" onClick={() => onNavigate('add-schedule')} style={{ display: 'inline-flex', marginLeft: 8 }}>+ Add one</button></p>
        </div>
      ) : (
        <div className="schedule-list">
          {trips.map((t, i) => {
            const avail    = parseInt(t.availableSeats) || 0;
            const total    = parseInt(t.totalSeats) || 1;
            const pct      = Math.round((avail / total) * 100);
            const barColor = pct > 60 ? '#16a34a' : pct > 30 ? '#f59e0b' : '#ef4444';
            const stCol    = STATUS_COLORS[t.status] || '#6b7280';
            const isLocal  = !!t.isNew; // only locally-added trips are editable

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
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: 6, padding: '4px 12px', fontSize: '0.78rem' }}
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
                </div>
              </div>
            );
          })}
        </div>
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
