import React, { useState, useEffect, useMemo } from 'react';
import { getSeatData } from '../services/api';
import BusSeatLayout from './BusSeatLayout';

/* ── localStorage key for blocked seats ── */
const BLOCKED_KEY = 'c2b_blocked_seats';

/* ── Format date helper ── */
function fmtDate(raw) {
  if (!raw || raw === '—') return '—';
  try {
    return new Date(raw).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return raw; }
}

/* ── Load all blocked seats from localStorage ── */
function loadAllBlocked() {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_KEY) || '{}');
  } catch { return {}; }
}

/* ── Save blocked seats for a trip ── */
function saveBlocked(tripId, seats) {
  const all = loadAllBlocked();
  all[tripId] = seats;
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(all));
  try { window.dispatchEvent(new Event('storage')); } catch {}
}

/* ─────────────────────────────────────────────────────────────
   Passenger Info Drawer  (slides in from right)
   ───────────────────────────────────────────────────────────── */
function PassengerDrawer({ seat, passenger, onClose, onBlock, onUnblock, isBlocked }) {
  if (!seat) return null;

  return (
    <div className="pax-drawer">
      <div className="pax-drawer-header">
        <div>
          <div className="pax-drawer-title">💺 Seat {seat}</div>
          <div className="pax-drawer-sub">
            {passenger ? 'Passenger Details' : isBlocked ? 'Seat is Blocked' : 'Seat is Available'}
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      {!passenger ? (
        <div style={{ padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {isBlocked ? '🚫' : 'ℹ️'}
            </div>
            <p style={{ fontSize: '0.85rem' }}>
              {isBlocked
                ? 'This seat is currently blocked by the operator.'
                : 'No passenger has booked this seat yet.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!isBlocked && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', background: '#ef4444', borderColor: '#ef4444' }}
                onClick={onBlock}
              >
                🚫 Block This Seat
              </button>
            )}
            {isBlocked && (
              <button
                className="btn btn-outline"
                style={{ width: '100%' }}
                onClick={onUnblock}
              >
                ✅ Unblock Seat
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="pax-info-badge">
            <span className="pax-status-dot" />
            {passenger.status || 'CONFIRMED'}
          </div>
          <div className="pax-field-list">
            <div className="pax-field">
              <span className="pax-field-label">👤 Name</span>
              <span className="pax-field-value">{passenger.name}</span>
            </div>
            <div className="pax-field">
              <span className="pax-field-label">📞 Phone</span>
              <span className="pax-field-value">{passenger.phone}</span>
            </div>
            <div className="pax-field">
              <span className="pax-field-label">📧 Email</span>
              <span className="pax-field-value">{passenger.email || '—'}</span>
            </div>
            <div className="pax-field">
              <span className="pax-field-label">🎫 Booking ID</span>
              <span className="pax-field-value mono">{passenger.bookingId}</span>
            </div>
            <div className="pax-field">
              <span className="pax-field-label">📅 Booked On</span>
              <span className="pax-field-value">{fmtDate(passenger.bookingDate)}</span>
            </div>
            <div className="pax-field">
              <span className="pax-field-label">💵 Fare Paid</span>
              <span className="pax-field-value">
                {passenger.fare && passenger.fare !== '—'
                  ? `₹${Number(passenger.fare).toLocaleString('en-IN')}`
                  : '—'}
              </span>
            </div>
            {passenger.seats && passenger.seats.length > 0 && (
              <div className="pax-field">
                <span className="pax-field-label">🪑 All Seats</span>
                <span className="pax-field-value">{passenger.seats.join(', ')}</span>
              </div>
            )}
            {(passenger.from || passenger.boardingPoint) && (passenger.to || passenger.droppingPoint) && (
              <div className="pax-field">
                <span className="pax-field-label">📍 Boarding ➔ Dropping</span>
                <span className="pax-field-value" style={{ fontWeight: 700, color: '#1e40af' }}>
                  {passenger.from || passenger.boardingPoint} ➔ {passenger.to || passenger.droppingPoint}
                </span>
              </div>
            )}
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', color: '#6b7280', fontSize: '0.78rem', textAlign: 'center' }}>
            Confirmed booking — cannot be unblocked here
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Trip Seat Modal (full-screen style)
   ───────────────────────────────────────────────────────────── */
function TripSeatModal({ bus, onClose, showToast }) {
  const [activeSeat, setActiveSeat] = useState(null);
  const [blockedSeats, setBlockedSeats] = useState([]);

  /* Load & sync blocked seats for this trip from localStorage */
  useEffect(() => {
    const updateBlocked = () => {
      const all = loadAllBlocked();
      setBlockedSeats(all[bus.tripId] || []);
    };
    updateBlocked();
    window.addEventListener('storage', updateBlocked);
    window.addEventListener('c2b_sync', updateBlocked);
    return () => {
      window.removeEventListener('storage', updateBlocked);
      window.removeEventListener('c2b_sync', updateBlocked);
    };
  }, [bus.tripId]);

  const {
    name, type, route, from, to, time, total = 40, fare = 650,
    bookedSeatList = [], passengerMap = {}, tripId,
  } = bus;

  const bookedCount   = bus.bookedCount != null ? bus.bookedCount : bookedSeatList.length;
  const blockedCount  = blockedSeats.length;
  const availCount    = Math.max(0, total - bookedCount - blockedCount);
  const pct           = total > 0 ? Math.round((bookedCount / total) * 100) : 0;

  const isBooked   = (seatId) => bookedSeatList.includes(seatId);
  const isBlocked  = (seatId) => blockedSeats.includes(seatId);
  const passenger  = activeSeat ? (passengerMap[activeSeat] || null) : null;

  const handleSeatClick = (seat) => {
    const id = typeof seat === 'object' ? seat.seatId : seat;
    setActiveSeat((prev) => (prev === id ? null : id));
  };

  const handleBlock = () => {
    if (!activeSeat) return;
    if (isBooked(activeSeat)) {
      showToast && showToast('Cannot block a confirmed booking seat.', 'error');
      return;
    }
    const updated = [...new Set([...blockedSeats, activeSeat])];
    setBlockedSeats(updated);
    saveBlocked(tripId, updated);
    showToast && showToast(`Seat ${activeSeat} blocked successfully.`, 'success');
  };

  const handleUnblock = () => {
    if (!activeSeat) return;
    if (isBooked(activeSeat)) {
      showToast && showToast('Cannot unblock a confirmed booking.', 'error');
      return;
    }
    const updated = blockedSeats.filter((s) => s !== activeSeat);
    setBlockedSeats(updated);
    saveBlocked(tripId, updated);
    showToast && showToast(`Seat ${activeSeat} unblocked.`, 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box seat-modal-wide${activeSeat ? ' with-drawer' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: activeSeat ? 1100 : 940, width: '96%' }}
      >
        {/* ── Header ── */}
        <div className="modal-header-row">
          <div>
            <div className="modal-title">🚍 {name}
              <span style={{
                display: 'inline-block', marginLeft: '0.75rem',
                background: '#fff7ed', color: '#ea580c',
                fontSize: '0.75rem', fontWeight: 600,
                padding: '2px 10px', borderRadius: 20,
                border: '1px solid #fed7aa',
                verticalAlign: 'middle',
              }}>{type}</span>
            </div>
            <div className="modal-sub">
              📍 {route} &nbsp;·&nbsp; 🕐 {time} &nbsp;·&nbsp; 💺 {total} Seats &nbsp;·&nbsp; ₹{fare.toLocaleString('en-IN')} / seat
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Seat Stats Strip ── */}
        <div className="seat-summary-strip">
          <div className="seat-summary-item blue">
            <span className="seat-summary-num">{total}</span>
            <span className="seat-summary-lbl">Total</span>
          </div>
          <div className="seat-summary-item red">
            <span className="seat-summary-num">{bookedCount}</span>
            <span className="seat-summary-lbl">Booked</span>
          </div>
          <div className="seat-summary-item green">
            <span className="seat-summary-num">{availCount}</span>
            <span className="seat-summary-lbl">Available</span>
          </div>
          <div className="seat-summary-item orange">
            <span className="seat-summary-num">{blockedCount}</span>
            <span className="seat-summary-lbl">Blocked</span>
          </div>
          <div className="seat-summary-item" style={{ color: '#7c3aed' }}>
            <span className="seat-summary-num">{pct}%</span>
            <span className="seat-summary-lbl">Occupancy</span>
          </div>
        </div>

        {/* ── Body: Seat layout + optional drawer ── */}
        <div className="seat-modal-body">
          {/* Left: Seat Map */}
          <div className="modal-body-scroll">
            <BusSeatLayout
              busType={type}
              fare={fare}
              totalSeats={total}
              bookedSeatList={bookedSeatList}
              passengerMap={passengerMap}
              activeSeat={activeSeat}
              onSeatClick={handleSeatClick}
              isPreview={false}
              blockedSeats={blockedSeats}
            />

            {/* Legend */}
            <div style={{
              display: 'flex', gap: '1rem', flexWrap: 'wrap',
              padding: '0.75rem 1rem', marginTop: '0.5rem',
              background: '#f8fafc', borderRadius: 10,
              fontSize: '0.78rem', color: '#374151',
            }}>
              <span>🟢 Available</span>
              <span>🔴 Booked</span>
              <span>🟡 Selected</span>
              <span>⬛ Blocked</span>
            </div>
          </div>

          {/* Right: Passenger Drawer */}
          {activeSeat && (
            <PassengerDrawer
              seat={activeSeat}
              passenger={passenger}
              onClose={() => setActiveSeat(null)}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              isBlocked={isBlocked(activeSeat)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bus Trip Card
   ───────────────────────────────────────────────────────────── */
function BusTripCard({ bus, onView }) {
  const blockedAll   = loadAllBlocked();
  const blockedCount = (blockedAll[bus.tripId] || []).length;
  const bookedCount  = bus.bookedCount != null ? bus.bookedCount : (bus.bookedSeatList || []).length;
  const totalSeats   = bus.total || 40;
  const availCount   = Math.max(0, totalSeats - bookedCount - blockedCount);
  const pct          = Math.min(100, totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
  const barClass     = pct >= 90 ? 'red' : pct >= 65 ? 'orange' : 'green';

  /* Journey date — read from raw schedule if available */
  const journeyDate = bus.journeyDate || '';

  return (
    <div className="seat-mg-card" onClick={() => onView(bus)} style={{ cursor: 'pointer' }}>
      {/* ── Card Header ── */}
      <div className="seat-mg-header">
        <div>
          <div className="seat-mg-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚍 {bus.name}
            <span style={{
              background: '#fff7ed', color: '#ea580c',
              fontSize: '0.7rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
              border: '1px solid #fed7aa',
            }}>{bus.type}</span>
          </div>
          <div className="seat-mg-sub">
            📍 {bus.from} → {bus.to}
            {bus.direction && (
              <span style={{
                marginLeft: '0.4rem',
                background: bus.direction === 'UP' ? '#e0f2fe' : '#fef3c7',
                color: bus.direction === 'UP' ? '#0369a1' : '#b45309',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                {bus.direction === 'UP' ? '⬆ UP' : '⬇ DOWN'}
              </span>
            )}
            {journeyDate && (
              <span style={{ marginLeft: '0.5rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                · {new Date(journeyDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
            🕐 {bus.time} &nbsp;·&nbsp; ₹{bus.fare?.toLocaleString('en-IN')} / seat
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="seat-mg-count">{bookedCount}/{totalSeats}</div>
          <div className="seat-mg-label">Booked / Total ({pct}%)</div>
          {blockedCount > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.2rem' }}>
              🚫 {blockedCount} Blocked
            </div>
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="seat-mg-progress">
        <div className={`seat-mg-bar ${barClass}`} style={{ width: `${pct}%` }} />
      </div>

      {/* ── Chip Row + View Button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            background: '#dcfce7', color: '#16a34a',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>✅ {availCount} Available</span>
          <span style={{
            background: '#fee2e2', color: '#dc2626',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>🎫 {bookedCount} Booked</span>
          <span style={{
            background: '#dbeafe', color: '#1d4ed8',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>💺 {totalSeats} Total</span>
        </div>
        <button
          className="btn-view-seats"
          onClick={(e) => { e.stopPropagation(); onView(bus); }}
        >
          💺 View Seats
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main SeatManagement page
   ───────────────────────────────────────────────────────────── */
export default function SeatManagement({ provider, onNavigate, showToast }) {
  const [buses, setBuses]               = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('ALL');

  /* ── Load & refresh buses ── */
  useEffect(() => {
    const refresh = () => setBuses(getSeatData());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('c2b_sync', refresh);
    const interval = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('c2b_sync', refresh);
      clearInterval(interval);
    };
  }, []);

  /* ── Derive available bus types for dropdown ── */
  const busTypes = ['ALL', ...Array.from(new Set(buses.map((b) => b.type).filter(Boolean)))];

  /* ── Derive live modal bus dynamically from buses state ── */
  const activeModalBus = useMemo(() => {
    if (!selectedBusId) return null;
    return buses.find((b) => b.id === selectedBusId || b.tripId === selectedBusId) || null;
  }, [buses, selectedBusId]);

  /* ── Filter logic ── */
  const filtered = buses.filter((bus) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      bus.name?.toLowerCase().includes(q) ||
      bus.route?.toLowerCase().includes(q) ||
      bus.from?.toLowerCase().includes(q) ||
      bus.to?.toLowerCase().includes(q);

    const matchType =
      filterType === 'ALL' ||
      (bus.type || '').toLowerCase().includes(filterType.toLowerCase());

    return matchSearch && matchType;
  });

  /* ── Summary stats ── */
  const totalBuses   = filtered.length;
  const totalBooked  = filtered.reduce((acc, b) => acc + (b.bookedCount != null ? b.bookedCount : (b.bookedSeatList || []).length), 0);
  const totalSeats   = filtered.reduce((acc, b) => acc + (b.total || 0), 0);
  const allBlocked   = loadAllBlocked();
  const totalBlocked = filtered.reduce((acc, b) => acc + (allBlocked[b.tripId] || []).length, 0);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h3>Trip Seat Availability Monitoring</h3>
          <p>Monitor seat occupancy for all assigned trips. Click any trip to view the interactive seat map, passenger details, and block/unblock seats.</p>
        </div>
      </div>

      {/* ── Summary Stats Row ── */}
      {buses.length > 0 && (
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}>
          {[
            { label: 'Active Trips', value: totalBuses, icon: '🚍', color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Total Seats',  value: totalSeats,  icon: '💺', color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Booked',       value: totalBooked, icon: '🎫', color: '#dc2626', bg: '#fef2f2' },
            { label: 'Blocked',      value: totalBlocked,icon: '🚫', color: '#d97706', bg: '#fffbeb' },
            { label: 'Available',    value: Math.max(0, totalSeats - totalBooked - totalBlocked), icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} style={{
              flex: '1 1 130px',
              background: bg, border: `1px solid ${color}22`,
              borderRadius: 12, padding: '0.85rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              minWidth: 120,
            }}>
              <span style={{ fontSize: '1.6rem' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Row ── */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        marginBottom: '1.25rem', alignItems: 'center',
      }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search by bus name or route…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 240px', maxWidth: 360 }}
        />
        <select
          className="form-control"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ flex: '0 0 auto', minWidth: 160 }}
        >
          {busTypes.map((t) => (
            <option key={t} value={t}>
              {t === 'ALL' ? 'All Types' : t}
            </option>
          ))}
        </select>
        {(search || filterType !== 'ALL') && (
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem' }}
            onClick={() => { setSearch(''); setFilterType('ALL'); }}
          >
            ✕ Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#6b7280' }}>
          Showing {filtered.length} of {buses.length} trips
        </div>
      </div>

      {/* ── Empty State ── */}
      {buses.length === 0 && (
        <div className="empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚏</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1e293b', fontWeight: 700 }}>No Assigned Buses Found</h3>
          <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
            To monitor real-time seat availability, customer bookings, and coach seat layouts, first assign your registered fleet buses to route corridors in Bus Fleet &amp; Routes.
          </p>
          {onNavigate && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('fleet-management')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              🚍 Go to Bus Fleet &amp; Routes
            </button>
          )}
        </div>
      )}

      {buses.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>No matching trips</h3>
          <p style={{ color: '#6b7280' }}>Try a different search term or filter.</p>
        </div>
      )}

      {/* ── Bus Trip Cards Grid ── */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {filtered.map((bus) => (
            <BusTripCard
              key={bus.id}
              bus={bus}
              onView={(b) => setSelectedBusId(b.id || b.tripId)}
            />
          ))}
        </div>
      )}

      {/* ── Seat Modal (Dynamically Updated Live) ── */}
      {activeModalBus && (
        <TripSeatModal
          bus={activeModalBus}
          onClose={() => setSelectedBusId(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
