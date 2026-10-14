import React, { useState } from 'react';
import { User, Mail, Phone, ArrowLeft, ArrowRight } from 'lucide-react';

export default function PassengerForms({
  selectedSeats,
  customer,
  onProceed,
  onBack,
}) {
  const [passengers, setPassengers] = useState(() => {
    return selectedSeats.map((seat, idx) => ({
      seat,
      name: idx === 0 ? customer?.name || '' : '',
      email: idx === 0 ? customer?.email || '' : '',
      phone: idx === 0 ? customer?.phone || '' : '',
      age: '',
      gender: 'Male',
    }));
  });

  const [errorMsg, setErrorMsg] = useState('');

  const updateField = (index, field, value) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,}$/;

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const seat = p.seat;
      const nv = (p.name || '').trim();
      const av = (p.age || '').toString().trim();
      const ev = (p.email || '').trim();
      const pv = (p.phone || '').trim();

      if (!nv) {
        setErrorMsg(`Passenger ${i + 1} (${seat}): Please enter full name.`);
        return;
      }
      if (/[0-9]/.test(nv)) {
        setErrorMsg(`Passenger ${i + 1}: Name must not contain numbers.`);
        return;
      }
      if (nv.length < 2) {
        setErrorMsg(`Passenger ${i + 1}: Name must be at least 2 characters.`);
        return;
      }

      if (!av) {
        setErrorMsg(`Passenger ${i + 1} (${seat}): Age is required.`);
        return;
      }
      const aN = Number(av);
      if (!Number.isFinite(aN) || aN !== Math.floor(aN)) {
        setErrorMsg(`Passenger ${i + 1}: Age must be a whole number.`);
        return;
      }
      if (aN < 1 || aN > 120) {
        setErrorMsg(`Passenger ${i + 1} (${seat}): Age must be between 1 and 120.`);
        return;
      }

      if (!ev) {
        setErrorMsg(`Passenger ${i + 1} (${seat}): Please enter email.`);
        return;
      }
      if (!emailRegex.test(ev)) {
        setErrorMsg(`Passenger ${i + 1}: Invalid email — ${ev}`);
        return;
      }

      if (!pv) {
        setErrorMsg(`Passenger ${i + 1} (${seat}): Please enter phone number.`);
        return;
      }
      const digs = pv.replace(/[\s\-\+\(\)]/g, '');
      if (!/^\d{10,13}$/.test(digs)) {
        setErrorMsg(`Passenger ${i + 1}: Phone must be 10–13 digits.`);
        return;
      }
      if (/^(.)\1+$/.test(digs)) {
        setErrorMsg(`Passenger ${i + 1}: Phone cannot be all same digits.`);
        return;
      }
    }

    sessionStorage.setItem('c2b_passengers', JSON.stringify(passengers));
    onProceed(passengers);
  };

  return (
    <div className="pax-container-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={16} /> Back to seat map
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
          {selectedSeats.length} Passenger{selectedSeats.length > 1 ? 's' : ''} Selected
        </span>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
        Passenger Details
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        {selectedSeats.length > 1
          ? `Fill details for all ${selectedSeats.length} passengers before proceeding to payment.`
          : 'Enter traveler contact and personal information.'}
      </p>

      {errorMsg && (
        <div style={{ background: '#fff1f2', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '0.84rem', color: '#ef4444', fontWeight: 700, marginBottom: '16px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {passengers.map((p, idx) => (
          <div key={p.seat} className="pax-passenger-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem' }}>
                {idx + 1}
              </div>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.9rem' }}>
                Passenger {idx + 1} &nbsp;
                <span style={{ fontSize: '.75rem', color: '#64748b', background: '#e2e8f0', padding: '2px 10px', borderRadius: '50px' }}>
                  Seat {p.seat}
                </span>
              </div>
            </div>

            <div className="pax-field">
              <label className="pax-label">FULL NAME</label>
              <div className="pax-input-wrap">
                <User size={16} className="pax-icon" />
                <input
                  type="text"
                  className="pax-input"
                  placeholder="e.g. Rahul Sharma"
                  value={p.name}
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="pax-field">
                <label className="pax-label">AGE (YEARS)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="pax-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="25"
                  value={p.age}
                  onChange={(e) => updateField(idx, 'age', e.target.value)}
                  required
                />
              </div>

              <div className="pax-field">
                <label className="pax-label">GENDER</label>
                <div className="gender-group">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`gender-btn ${p.gender === g ? 'active' : ''}`}
                      onClick={() => updateField(idx, 'gender', g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="pax-field">
                <label className="pax-label">EMAIL ADDRESS</label>
                <div className="pax-input-wrap">
                  <Mail size={16} className="pax-icon" />
                  <input
                    type="email"
                    className="pax-input"
                    placeholder="email@example.com"
                    value={p.email}
                    onChange={(e) => updateField(idx, 'email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pax-field">
                <label className="pax-label">PHONE NUMBER</label>
                <div className="pax-input-wrap">
                  <Phone size={16} className="pax-icon" />
                  <input
                    type="tel"
                    className="pax-input"
                    placeholder="9876543210"
                    value={p.phone}
                    onChange={(e) => updateField(idx, 'phone', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button type="submit" className="btn-orange" style={{ width: '100%', marginTop: '10px' }}>
          Review Booking & Pay <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
