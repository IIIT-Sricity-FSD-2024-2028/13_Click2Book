import React, { useState, useEffect, useMemo } from 'react';
import { getSeatData, getFleetBuses, getTripBookings } from '../services/api';
import BusSeatLayout from './BusSeatLayout';

/* ── localStorage key for blocked seats ── */
const BLOCKED_KEY = 'c2b_blocked_seats';

/* ── Format date helper with Day of Week ── */
function fmtDate(raw) {
  if (!raw || raw === '—') return '—';
  try {
    let d;
    if (String(raw).includes('T')) {
      d = new Date(raw);
    } else {
      const parts = String(raw).split('-').map(Number);
      if (parts.length === 3) {
        d = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        d = new Date(raw);
      }
    }
    if (isNaN(d.getTime())) return raw;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getDay()];
    const mName = months[d.getMonth()];
    const dateNum = String(d.getDate()).padStart(2, '0');
    const yr = d.getFullYear();
    return `${dateNum} ${mName} ${yr} (${dayName})`;
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
            {(passenger.gender || (passenger.age && passenger.age !== '—')) && (
              <div className="pax-field">
                <span className="pax-field-label">👥 Gender / Age</span>
                <span className="pax-field-value">
                  {passenger.gender || '—'}{passenger.age && passenger.age !== '—' ? `, ${passenger.age} yrs` : ''}
                </span>
              </div>
            )}
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
            {passenger.seats && (
              <div className="pax-field">
                <span className="pax-field-label">🪑 All Seats</span>
                <span className="pax-field-value">
                  {Array.isArray(passenger.seats) ? passenger.seats.join(', ') : passenger.seats}
                </span>
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
  const passenger = activeSeat
    ? (passengerMap[activeSeat] ||
       passengerMap[String(activeSeat).toUpperCase()] ||
       passengerMap[String(activeSeat).toLowerCase()] ||
       Object.entries(passengerMap).find(([k]) => String(k).toUpperCase() === String(activeSeat).toUpperCase())?.[1] ||
       null)
    : null;

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
              📍 {route} &nbsp;·&nbsp; 🕐 {time} &nbsp;·&nbsp; 💺 {total} Seats &nbsp;·&nbsp; ₹{Number(fare || 650).toLocaleString('en-IN')} / seat
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
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = (journeyDate || '').split('T')[0] === todayStr;

  return (
    <div className="seat-mg-card" onClick={() => onView(bus)} style={{ cursor: 'pointer' }}>
      {/* ── Card Header ── */}
      <div className="seat-mg-header">
        <div>
          <div className="seat-mg-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>🚍 {bus.name}</span>
            {bus.vehicleNumber && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', background: '#dbeafe', padding: '2px 7px', borderRadius: 4 }}>
                {bus.vehicleNumber}
              </span>
            )}
            {isToday && (
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                🌟 Today's Trip
              </span>
            )}
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
              <span style={{ marginLeft: '0.5rem', color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>
                · 📅 {fmtDate(journeyDate)}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
            🕐 {bus.time} &nbsp;·&nbsp; ₹{Number(bus.fare || 650).toLocaleString('en-IN')} / seat
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
  const [busNumberFilter, setBusNumberFilter] = useState('all');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [datePreset, setDatePreset]     = useState('today');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);

  // Fleet buses from BusFleetManagement — this is the single source of truth for assigned fleet
  const fleetBuses = useMemo(() => {
    try {
      const all = getFleetBuses(provider?.id) || [];
      return all.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);
    } catch {
      return [];
    }
  }, [provider?.id]);

  /* ── Load & refresh buses ── */
  useEffect(() => {
    let timer = null;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        // 1. Proactively synchronize unified state from backend /api/sync/state
        try {
          const syncRes = await fetch('/api/sync/state');
          const syncJson = await syncRes.json();
          const serverBookings = syncJson?.data?.bookings || (Array.isArray(syncJson?.bookings) ? syncJson.bookings : []);
          if (Array.isArray(serverBookings) && serverBookings.length > 0) {
            const cur = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
            const curMap = new Map();
            cur.forEach((b) => {
              const bId = b.bookingId || b.booking_id || b.id;
              if (bId) curMap.set(bId, b);
            });
            let changed = false;
            serverBookings.forEach((sb) => {
              const sbId = sb.bookingId || sb.booking_id || sb.id;
              if (sbId) {
                const existing = curMap.get(sbId);
                const isCancelled =
                  sb.bookingStatus === 'CANCELLED' ||
                  sb.status === 'CANCELLED' ||
                  sb.booking_status === 'CANCELLED';

                if (isCancelled) {
                  if (!existing || existing.status !== 'CANCELLED' || existing.bookingStatus !== 'CANCELLED') {
                    curMap.set(sbId, { ...existing, ...sb, status: 'CANCELLED', booking_status: 'CANCELLED', bookingStatus: 'CANCELLED' });
                    changed = true;
                  }
                } else if (!existing) {
                  curMap.set(sbId, sb);
                  changed = true;
                } else if (!existing.passengers && sb.passengers) {
                  curMap.set(sbId, { ...existing, ...sb });
                  changed = true;
                }
              }
            });
            if (changed) {
              localStorage.setItem('c2b_bookings', JSON.stringify(Array.from(curMap.values())));
            }
          }
        } catch {
          // Fallback gracefully
        }

        const data = getSeatData(provider?.id);
        const baseBuses = Array.isArray(data) ? data : [];
        let bookingFetchError = null;
        const merged = await Promise.all(baseBuses.map(async (bus) => {
          const tripIds = [
            bus.backendTripId,
            bus.tripId,
            bus.id,
          ].filter(Boolean);
          let bookings = [];
          for (const tripId of [...new Set(tripIds)]) {
            try {
              const found = await getTripBookings(tripId);
              if (Array.isArray(found)) {
                bookings = [...bookings, ...found];
              }
            } catch (error) {
              bookingFetchError = error;
              break;
            }
          }
          const activeBookings = bookings
            .filter((b) => (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING') &&
                           b.bookingStatus !== 'CANCELLED' && b.status !== 'CANCELLED');

          let localBookings = [];
          try {
            localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
          } catch {}

          const seatNumbers = [];
          const customerSeatGroups = new Map();
          const normalizeBookedSeat = (rawSeat) => {
            const seatId = String(rawSeat || '').trim().toUpperCase();
            if (/^\d+$/.test(seatId)) return seatId;
            const sleeperMatch = seatId.match(/^([LU])(\d+)$/);
            if (sleeperMatch) {
              const half = Math.ceil(Number(bus.total || 40) / 2);
              return sleeperMatch[1] === 'L'
                ? String(parseInt(sleeperMatch[2], 10))
                : String(half + parseInt(sleeperMatch[2], 10));
            }
            const seaterMatch = seatId.match(/^([A-Z])(\d+)$/);
            if (seaterMatch) {
              const row = seaterMatch[1].charCodeAt(0) - 65;
              const col = parseInt(seaterMatch[2], 10);
              return String(row * 4 + col);
            }
            return seatId;
          };

          const bookingMatchesTripDirection = (booking) => {
            const bookingFrom = cleanCity(booking.from || booking.source || '');
            const bookingTo = cleanCity(booking.to || booking.destination || '');
            const tripFrom = cleanCity(bus.from);
            const tripTo = cleanCity(bus.to);
            if (!bookingFrom || !bookingTo || !tripFrom || !tripTo) return true;
            if (bookingFrom === tripTo && bookingTo === tripFrom) return false;

            const intermediateStops = Array.isArray(bus.intermediateStops)
              ? bus.intermediateStops
              : [...(bus.assignedRoute?.intermediateStops || [])];
            if (!Array.isArray(bus.intermediateStops) && bus.direction === 'DOWN') intermediateStops.reverse();
            const stops = Array.isArray(bus.allStops) && bus.allStops.length > 0
              ? bus.allStops
              : [bus.from, ...intermediateStops, bus.to];
            const orderedStops = stops.map(cleanCity).filter(Boolean);
            const bookingStart = orderedStops.indexOf(bookingFrom);
            const bookingEnd = orderedStops.indexOf(bookingTo);
            if (bookingStart !== -1 && bookingEnd !== -1) return bookingStart < bookingEnd;
            return bookingFrom === tripFrom && bookingTo === tripTo;
          };
          const routeMatchedBookings = activeBookings.filter(bookingMatchesTripDirection);

          // Merge local confirmed bookings with backend bookings.
          const busPlate = String(bus.vehicleNumber || bus.plateNumber || '')
            .trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const busDate = String(bus.journeyDate || bus.date || '').split('T')[0];
          const cleanCity = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

          localBookings.forEach((booking) => {
            if (
              booking.status === 'CANCELLED' ||
              booking.booking_status === 'CANCELLED' ||
              booking.bookingStatus === 'CANCELLED'
            ) return;
            const bookingDate = String(booking.date || booking.journeyDate || '').split('T')[0];
            if (bookingDate && busDate && bookingDate !== busDate) return;

            const bookingPlate = String(booking.vehicleNumber || booking.plateNumber || '')
              .trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            const bookingTrip = String(booking.tripId || booking.backendTripId || '').trim();
            const matchesTrip = tripIds.some((tripId) => tripId === bookingTrip);
            const matchesPlate = busPlate && bookingPlate && (busPlate === bookingPlate || busPlate.includes(bookingPlate) || bookingPlate.includes(busPlate));
            const matchesName = String(booking.busName || '').trim().toLowerCase() &&
              String(bus.name || bus.busName || '').trim().toLowerCase() &&
              (String(booking.busName).trim().toLowerCase() === String(bus.name || bus.busName).trim().toLowerCase() ||
               String(bus.name || bus.busName).trim().toLowerCase().includes(String(booking.busName).trim().toLowerCase()));

            const bFrom = cleanCity(booking.from);
            const bTo = cleanCity(booking.to);
            const matchesRoute = bookingMatchesTripDirection(booking);
            if (matchesTrip) {
              if (bFrom && bTo && !matchesRoute) return;
            } else if (!(matchesPlate || matchesName) || (bFrom && bTo && !matchesRoute)) {
              return;
            }

            const rawSeats = Array.isArray(booking.seat_list)
              ? booking.seat_list
              : Array.isArray(booking.seats)
              ? booking.seats
              : typeof booking.seats === 'string'
              ? booking.seats.split(',')
              : booking.seatNumber != null
              ? [booking.seatNumber]
              : [];
            const customerKey = String(booking.customerId || booking.customer_id || '').trim();
            rawSeats.map((seat) => String(seat).trim()).filter(Boolean).forEach((seat) => {
              const normalizedSeat = normalizeBookedSeat(seat);
              if (!seatNumbers.includes(normalizedSeat)) seatNumbers.push(normalizedSeat);
              if (customerKey) {
                if (!customerSeatGroups.has(customerKey)) customerSeatGroups.set(customerKey, new Set());
                customerSeatGroups.get(customerKey).add(normalizedSeat);
              }
            });
          });

          (Array.isArray(bus.bookedSeatList) ? bus.bookedSeatList : []).forEach((seat) => {
            const normalized = normalizeBookedSeat(seat);
            if (normalized && !seatNumbers.includes(normalized)) seatNumbers.push(normalized);
          });

          routeMatchedBookings.forEach((booking) => {
            const seat = normalizeBookedSeat(booking.seatNumber);
            if (!seat) return;
            if (!seatNumbers.includes(seat)) seatNumbers.push(seat);
            const customerKey = String(booking.customerId || booking.customer_id || '').trim();
            if (!customerKey) return;
            if (!customerSeatGroups.has(customerKey)) customerSeatGroups.set(customerKey, new Set());
            customerSeatGroups.get(customerKey).add(seat);
          });

          const passengerMap = {};
          seatNumbers.forEach((seat) => {
            const booking = routeMatchedBookings.find((b) =>
              normalizeBookedSeat(b.seatNumber) === normalizeBookedSeat(seat)
            );
            const customerId = String(booking?.customerId || booking?.customer_id || '').trim();
            const local = localBookings.find((b) => {
              const sameCustomer = !customerId ||
                String(b.customerId || b.customer_id || '') === customerId;
              if (!sameCustomer) return false;
              const localTrip = String(b.tripId || b.backendTripId || '').trim();
              const localPlate = String(b.vehicleNumber || b.plateNumber || '')
                .trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
              const localName = String(b.busName || '').trim().toLowerCase();
              const busName = String(bus.name || bus.busName || '').trim().toLowerCase();
              return tripIds.includes(localTrip) ||
                (busPlate && localPlate === busPlate) ||
                (busName && localName === busName);
            });
            const matchingPassenger = Array.isArray(local?.passengers)
              ? local.passengers.find((p) => {
                  const pSeat = String(p.seat || p.seatNumber || '').trim().toUpperCase();
                  return pSeat === seat.toUpperCase() || normalizeBookedSeat(pSeat) === normalizeBookedSeat(seat);
                })
              : null;
            const customerSeats = [...(customerSeatGroups.get(customerId) || new Set())];
            passengerMap[seat] = {
              name: matchingPassenger?.name || local?.passengerName || local?.customerName ||
                booking?.passengerName ||
                (Array.isArray(booking?.passengers) ? booking.passengers.find((p) => {
                  const pSeat = String(p.seat || p.seatNumber || '').trim().toUpperCase();
                  return pSeat === seat.toUpperCase() || normalizeBookedSeat(pSeat) === normalizeBookedSeat(seat);
                })?.name : null) ||
                `Customer ${customerId || 'Passenger'}`,
              gender: matchingPassenger?.gender || local?.gender || booking?.passengers?.find?.((p) => {
                const pSeat = String(p.seat || p.seatNumber || '').trim().toUpperCase();
                return pSeat === seat.toUpperCase() || normalizeBookedSeat(pSeat) === normalizeBookedSeat(seat);
              })?.gender || 'General',
              age: matchingPassenger?.age || local?.age ||
                booking?.passengers?.find?.((p) => {
                  const pSeat = String(p.seat || p.seatNumber || '').trim().toUpperCase();
                  return pSeat === seat.toUpperCase() || normalizeBookedSeat(pSeat) === normalizeBookedSeat(seat);
                })?.age || '—',
              phone: matchingPassenger?.phone || local?.phone || booking?.phone || '—',
              email: matchingPassenger?.email || local?.email || booking?.email || '—',
              bookingId: local?.primaryBackendId || local?.bookingId || booking?.bookingId || '—',
              bookingDate: local?.bookingDate || local?.createdAt || booking?.bookingDate || '—',
              fare: local?.fare || local?.total || '—',
              status: booking?.bookingStatus || 'CONFIRMED',
              seats: customerSeats.length > 0 ? customerSeats : [seat],
              from: local?.from || bus.from,
              to: local?.to || bus.to,
            };
          });

          const bookedVisualSeats = new Set(seatNumbers);
          seatNumbers.forEach((seat) => {
            const n = parseInt(seat, 10);
            if (!Number.isFinite(n)) return;
            bookedVisualSeats.add(String(n));
            const half = Math.ceil(Number(bus.total || 40) / 2);
            if (n <= half) {
              bookedVisualSeats.add(`L${n}`);
            } else {
              bookedVisualSeats.add(`U${n - half}`);
            }
            const row = String.fromCharCode(65 + Math.floor((n - 1) / 4));
            const col = ((n - 1) % 4) + 1;
            bookedVisualSeats.add(`${row}${col}`);
          });

          const expandedPassengerMap = { ...(bus.passengerMap || {}) };
          Object.entries(passengerMap).forEach(([seat, passenger]) => {
            const n = parseInt(seat, 10);
            expandedPassengerMap[seat] = passenger;
            if (Number.isFinite(n)) {
              const half = Math.ceil(Number(bus.total || 40) / 2);
              if (n <= half) expandedPassengerMap[`L${n}`] = passenger;
              else expandedPassengerMap[`U${n - half}`] = passenger;
              const row = String.fromCharCode(65 + Math.floor((n - 1) / 4));
              const col = ((n - 1) % 4) + 1;
              expandedPassengerMap[`${row}${col}`] = passenger;
            }
          });

          const distinctSeats = new Set(seatNumbers.map(normalizeBookedSeat).filter(Boolean));
          const bookedCount = distinctSeats.size;

          return {
            ...bus,
            bookedSeatList: Array.from(bookedVisualSeats),
            passengerMap: expandedPassengerMap,
            bookedCount,
            actualBookedCount: bookedCount,
          };
        }));
        if (bookingFetchError) {
          console.warn('[SeatManagement] Keeping the last seat snapshot; booking service is unavailable.', bookingFetchError);
          setBuses((current) => current.length > 0 ? current : baseBuses);
          return;
        }
        setBuses(merged);
      } catch (err) {
        console.error('Error refreshing seat data:', err);
      } finally {
        refreshing = false;
      }
    };

    refresh();
    timer = setInterval(refresh, 3000);
    window.addEventListener('storage', refresh);
    window.addEventListener('c2b_sync', refresh);
    window.addEventListener('focus', refresh);
    const handleVisChange = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('c2b_sync', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, [provider?.id]);

  /* ── Derive available bus types for dropdown ── */
  const busTypes = ['ALL', ...Array.from(new Set(buses.map((b) => b?.type).filter(Boolean)))];

  /* ── Extract unique bus plate numbers for Bus Number filter ── */
  const uniqueBusNumbers = useMemo(() => {
    const set = new Set();
    fleetBuses.forEach((b) => {
      const plate = b.vehicleNumber || b.regNo;
      if (plate && plate !== '—') set.add(String(plate).trim().toUpperCase());
    });
    buses.forEach((b) => {
      const plate = b.vehicleNumber || (b.name ? b.name.match(/[A-Z]{2}\s?[0-9]{2}\s?[A-Z]{1,2}\s?[0-9]{4}/i)?.[0] : null);
      if (plate && plate !== '—') set.add(String(plate).trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [fleetBuses, buses]);

  /* ── Derive live modal bus dynamically from buses state ── */
  const activeModalBus = useMemo(() => {
    if (!selectedBusId) return null;
    return buses.find((b) => b?.id === selectedBusId || b?.tripId === selectedBusId) || null;
  }, [buses, selectedBusId]);

  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();

  /* ── Filter logic ── */
  const filtered = buses.filter((bus) => {
    if (!bus) return false;
    const tripStatus = String(bus.status || bus.tripStatus || 'SCHEDULED').toUpperCase();
    if (tripStatus === 'COMPLETED' || tripStatus === 'CANCELLED') return false;

    // Strict alignment with BusFleetManagement: only display assigned fleet coaches
    if (fleetBuses.length > 0) {
      const bPlate = cleanCode(bus.vehicleNumber);
      const bId = cleanCode(bus.vehicleId || bus.id);
      const bName = cleanName(bus.name || bus.busName);
      const bTripId = cleanCode(bus.tripId);
      const belongsToFleet = fleetBuses.some((fb) => {
        const fp = cleanCode(fb.vehicleNumber);
        const fi = cleanCode(fb.vehicleId || fb.id);
        const fn = cleanName(fb.busName);
        return (fp && bPlate === fp) || (fi && bId === fi) || (fn && bName === fn) || (fp && bTripId.includes(fp));
      });
      if (!belongsToFleet) return false;
    }

    const q = (search || '').toLowerCase();
    const matchSearch =
      !q ||
      bus.name?.toLowerCase().includes(q) ||
      bus.vehicleNumber?.toLowerCase().includes(q) ||
      bus.route?.toLowerCase().includes(q) ||
      bus.from?.toLowerCase().includes(q) ||
      bus.to?.toLowerCase().includes(q);

    const matchType =
      filterType === 'ALL' ||
      (bus.type || '').toLowerCase().includes(filterType.toLowerCase());

    if (!matchSearch || !matchType) return false;

    // Bus Number filter
    if (busNumberFilter !== 'all') {
      const bPlate = cleanCode(bus.vehicleNumber || bus.name);
      const target = cleanCode(busNumberFilter);
      if (!bPlate.includes(target)) return false;
    }

    // Date filter: exclude past expired dates from active monitoring
    const jDate = (bus.journeyDate || '').split('T')[0];
    if (jDate && jDate < todayStr) return false;

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

  /* ── Priority Sorting: Today's buses first, then date ascending, then departure time ── */
  const sortedBuses = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // 1. PRIORITY 1: TODAY'S BUSES FIRST
      const isTodayA = (a.journeyDate || '').split('T')[0] === todayStr ? 0 : 1;
      const isTodayB = (b.journeyDate || '').split('T')[0] === todayStr ? 0 : 1;
      if (isTodayA !== isTodayB) return isTodayA - isTodayB;

      // 2. Upcoming dates ascending
      const dateA = (a.journeyDate || '').split('T')[0];
      const dateB = (b.journeyDate || '').split('T')[0];
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      // 3. Departure times ascending
      const timeA = a.departureTime || a.time || '';
      const timeB = b.departureTime || b.time || '';
      return timeA.localeCompare(timeB);
    });
  }, [filtered, todayStr]);

  /* ── Summary stats ── */
  const totalBuses   = sortedBuses.length;
  const totalBooked  = sortedBuses.reduce((acc, b) => acc + (b?.bookedCount != null ? Number(b.bookedCount) : (Array.isArray(b?.bookedSeatList) ? b.bookedSeatList.length : 0)), 0);
  const totalSeats   = sortedBuses.reduce((acc, b) => acc + Number(b?.total || 0), 0);
  const allBlocked   = loadAllBlocked();
  const totalBlocked = sortedBuses.reduce((acc, b) => acc + (Array.isArray(allBlocked?.[b?.tripId]) ? allBlocked[b.tripId].length : 0), 0);

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
            Only coaches assigned in Bus Fleet Management operate continuous round-trip schedules. Click a coach to filter seat availability.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => setBusNumberFilter('all')}
              style={{
                background: busNumberFilter === 'all' ? '#1d4ed8' : '#ffffff',
                color: busNumberFilter === 'all' ? '#ffffff' : '#1e40af',
                border: `1.5px solid ${busNumberFilter === 'all' ? '#1d4ed8' : '#93c5fd'}`,
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
              const isSel = busNumberFilter === bKey;
              const orig = b.assignedRoute?.originCity || 'Chennai';
              const dest = b.assignedRoute?.destCity || 'Vijayawada';
              return (
                <button
                  key={b.vehicleId || b.id || b.vehicleNumber}
                  type="button"
                  onClick={() => setBusNumberFilter(isSel ? 'all' : bKey)}
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
                  title={`View seat layouts for ${b.busName} (${b.vehicleNumber})`}
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

      {/* ── Filter Row ── */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        marginBottom: '1.25rem', alignItems: 'center',
        background: '#ffffff', padding: '10px 14px', borderRadius: 8,
        border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        {/* Search */}
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search plate, bus name, route…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 180px', maxWidth: 200, fontSize: '0.84rem' }}
        />

        {/* Bus Number Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="seatBusFilter" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#374151' }}>
            Bus Number:
          </label>
          <select
            id="seatBusFilter"
            className="form-control"
            value={busNumberFilter}
            onChange={(e) => setBusNumberFilter(e.target.value)}
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
            <option value="all">All Bus Numbers ({uniqueBusNumbers.length})</option>
            {uniqueBusNumbers.map((plate) => (
              <option key={plate} value={plate}>
                🚍 {plate}
              </option>
            ))}
          </select>
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

        {/* Date Dropdown & Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            id="seatDateFilter"
            className="form-control"
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
            <option value="custom">📅 Pick Date…</option>
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

        {/* Bus Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="seatTypeFilter" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#374151' }}>
            Type:
          </label>
          <select
            id="seatTypeFilter"
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ flex: '0 0 auto', minWidth: 100, fontSize: '0.84rem' }}
          >
            {busTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Types' : t}
              </option>
            ))}
          </select>
        </div>

        {(search || filterType !== 'ALL' || busNumberFilter !== 'all' || (datePreset !== 'today' && datePreset !== 'all') || (specificDate && specificDate !== todayStr)) && (
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            onClick={() => {
              setSearch('');
              setFilterType('ALL');
              setBusNumberFilter('all');
              setDatePreset('today');
              setSpecificDate(todayStr);
            }}
          >
            Reset Filters
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#6b7280' }}>
          Showing <strong>{sortedBuses.length}</strong> of {buses.length} trips
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

      {buses.length > 0 && sortedBuses.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>No matching trips</h3>
          <p style={{ color: '#6b7280' }}>Try a different search term or filter.</p>
        </div>
      )}

      {/* ── Bus Trip Cards Grid ── */}
      {sortedBuses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {sortedBuses.map((bus) => (
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
