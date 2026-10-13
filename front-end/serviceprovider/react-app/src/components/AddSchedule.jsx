import React, { useState, useEffect } from 'react';
import { saveSchedule } from '../services/api';

const BUS_TYPES = ['Sleeper AC', 'Semi-Sleeper', 'AC Seater', 'Volvo AC', 'Non-AC', 'Luxury'];

export default function AddSchedule({ onNavigate, showToast }) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0];
  })();

  const [form, setForm] = useState({
    journeyDate: today, from: '', to: '', via: '',
    dep: '', arr: '', busName: '', busType: '', seats: '', fare: '',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (!form.journeyDate)               return 'Please select a journey date.';
    if (form.journeyDate < todayStr)     return 'Journey date cannot be in the past.';
    if (form.journeyDate > maxDate)      return `Schedules can only be added up to 2 months in advance (max: ${maxDate}).`;
    if (!form.from.trim())               return 'Please enter the departure location.';
    if (/^\d+$/.test(form.from))         return 'Departure cannot be only numbers.';
    if (!form.to.trim())                 return 'Please enter the destination location.';
    if (/^\d+$/.test(form.to))           return 'Destination cannot be only numbers.';
    if (form.from.toLowerCase() === form.to.toLowerCase()) return 'Departure and destination cannot be the same.';
    if (!form.dep)                       return 'Please enter departure time.';
    if (!form.arr)                       return 'Please enter arrival time.';
    if (form.journeyDate === todayStr) {
      const curH = String(now.getHours()).padStart(2, '0');
      const curM = String(now.getMinutes()).padStart(2, '0');
      if (form.dep <= `${curH}:${curM}`) return `For today's date, departure time must be after current time (${curH}:${curM}).`;
    }
    if (!form.busName.trim())            return 'Please enter the bus name.';
    if (!form.busType)                   return 'Please select a bus type.';
    const seats = parseInt(form.seats, 10);
    if (!form.seats || isNaN(seats) || seats < 1) return 'Enter valid seat count (min 1).';
    if (seats > 100)                     return 'Seats cannot exceed 100.';
    const fare = parseInt(form.fare, 10);
    if (!form.fare || isNaN(fare) || fare < 1) return 'Enter valid fare (min ₹1).';
    return '';
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const result = await saveSchedule({
        journeyDate: form.journeyDate,
        from: form.from.trim(), to: form.to.trim(), via: form.via.trim(),
        dep: form.dep, arr: form.arr,
        busName: form.busName.trim(), busType: form.busType,
        seats: parseInt(form.seats, 10), fare: parseInt(form.fare, 10),
      });
      const viaText = form.via ? ` (Via ${form.via})` : '';
      const msg = `✅ ${form.busName} (${form.seats} Seats, ₹${form.fare}) for ${form.journeyDate} (${form.dep} → ${form.arr}) from ${form.from} → ${form.to}${viaText} added ${result.isLive ? 'successfully!' : 'locally (backend offline).'}`;
      setSuccess(msg);
      showToast(`Schedule added for ${form.from} → ${form.to}!`, result.isLive ? 'success' : 'info');
      setForm({ journeyDate: today, from: '', to: '', via: '', dep: '', arr: '', busName: '', busType: '', seats: '', fare: '' });
      setTimeout(() => onNavigate('manage-schedules'), 2000);
    } catch (e) {
      setError(e.message || 'Failed to save schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h3>Add New Schedule</h3>
          <p>Create a new trip schedule</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error   && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success" style={{whiteSpace:'pre-line'}}>{success}</div>}

          {/* Journey Date */}
          <div className="form-group">
            <label className="form-label">Journey Date / Operating Date</label>
            <div className="input-wrap">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" className="form-control" value={form.journeyDate} min={today} max={maxDate}
                onChange={set('journeyDate')} style={{ cursor: 'pointer' }} />
            </div>
            <span className="form-hint">* Schedules can be added from today up to a maximum of 2 months in advance.</span>
          </div>

          {/* From / To */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From (City / Location)</label>
              <div className="input-wrap">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input type="text" className="form-control" placeholder="e.g. Pune" value={form.from} onChange={set('from')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">To (City / Location)</label>
              <div className="input-wrap">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input type="text" className="form-control" placeholder="e.g. Mumbai" value={form.to} onChange={set('to')} />
              </div>
            </div>
          </div>

          {/* Via */}
          <div className="form-group">
            <label className="form-label">Via (Optional — Intermediate Stops / Highway / Landmark)</label>
            <div className="input-wrap">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              <input type="text" className="form-control" placeholder="e.g. Lonavala, Expressway (Optional)" value={form.via} onChange={set('via')} />
            </div>
            <span className="form-hint">* Optional: Add intermediate stops for a better customer booking experience.</span>
          </div>

          {/* Dep / Arr */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Departure Time (HH:MM)</label>
              <input type="time" className="form-control no-icon" value={form.dep} onChange={set('dep')} />
            </div>
            <div className="form-group">
              <label className="form-label">Arrival Time (HH:MM)</label>
              <input type="time" className="form-control no-icon" value={form.arr} onChange={set('arr')} />
            </div>
          </div>

          {/* Bus Name */}
          <div className="form-group">
            <label className="form-label">Bus Name / Vehicle Name</label>
            <input type="text" className="form-control no-icon" placeholder="e.g. Intercity Express, Volvo AC" value={form.busName} onChange={set('busName')} />
          </div>

          {/* Bus Type */}
          <div className="form-group">
            <label className="form-label">Bus Type</label>
            <select className="form-control no-icon" value={form.busType} onChange={set('busType')} style={{ cursor: 'pointer' }}>
              <option value="">-- Select Bus Type --</option>
              {BUS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Seats / Fare */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Seats</label>
              <input type="number" className="form-control no-icon" placeholder="e.g. 40" min="1" max="100" value={form.seats} onChange={set('seats')} />
            </div>
            <div className="form-group">
              <label className="form-label">Fare Per Seat (₹)</label>
              <input type="number" className="form-control no-icon" placeholder="e.g. 550" min="1" value={form.fare} onChange={set('fare')} />
            </div>
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 8, padding: '0.875rem', fontSize: '0.95rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {loading ? '⏳ Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
