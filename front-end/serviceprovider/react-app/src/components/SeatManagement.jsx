import React, { useState, useEffect } from 'react';
import { getSeatData } from '../services/api';

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

/* ─────────────────────────────────────────────────────────────
   Passenger Info Drawer
   ───────────────────────────────────────────────────────────── */
function PassengerDrawer({ seat, passenger, onClose }) {
  if (!seat) return null;
  return (
    <div className="pax-drawer">
      <div className="pax-drawer-header">
        <div>
          <div className="pax-drawer-title">💺 Seat {seat}</div>
          <div className="pax-drawer-sub">Passenger Details</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      {!passenger ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ℹ️</div>
          <p style={{ fontSize: '0.85rem' }}>No passenger data found for this seat in local bookings.</p>
        </div>
      ) : (
        <>
          <div className="pax-info-badge">
            <span className="pax-status-dot" />
            {passenger.status}
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
              <span className="pax-field-value">{passenger.email}</span>
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
                {passenger.fare !== '—'
                  ? `₹${Number(passenger.fare).toLocaleString('en-IN')}`
                  : '—'}
              </span>
            </div>
            <div className="pax-field">
              <span className="pax-field-label">🪑 All Seats</span>
              <span className="pax-field-value">
                {passenger.seats && passenger.seats.length > 0
                  ? passenger.seats.join(', ')
                  : seat}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Seat Layout Modal
   ───────────────────────────────────────────────────────────── */
function SeatModal({ bus, onClose }) {
  const [activeSeat, setActiveSeat] = useState(null);

  if (!bus) return null;

  const {
    name, type, route, total = 40,
    bookedSeatList = [], passengerMap = {},
  } = bus;

  const bookedCount = bookedSeatList.length;
  const availCount  = Math.max(0, total - bookedCount);
  const totalRows   = Math.ceil(total / 4);

  const rows = Array.from({ length: totalRows }, (_, r) => {
    const rowLetter = String.fromCharCode(65 + r);
    return {
      rowLetter,
      seats: [1, 2, 3, 4].map((col) => {
        const seatNum = r * 4 + col;
        if (seatNum > total) return null;
        const seatId   = `${rowLetter}${col}`;
        const isBooked = bookedSeatList.includes(seatId);
        return { seatId, isBooked };
      }),
    };
  });

  const selectedPassenger = activeSeat ? (passengerMap[activeSeat] || null) : null;

  const handleSeatClick = (seat) => {
    if (!seat.isBooked) return;
    setActiveSeat((prev) => (prev === seat.seatId ? null : seat.seatId));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box seat-modal-wide${activeSeat ? ' with-drawer' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <div className="modal-title">🚍 {name} ({type})</div>
            <div className="modal-sub">{route} · Total: {total} Seats</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="seat-modal-body">
          {/* Left: Seat Map */}
          <div className="modal-body-scroll">
            {/* Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-box avail" />
                Available ({availCount})
              </div>
              <div className="legend-item">
                <div className="legend-box booked" />
                Booked ({bookedCount})
              </div>
              {bookedCount > 0 && (
                <div className="legend-item" style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  🖱️ Click booked seat for passenger
                </div>
              )}
            </div>

            {/* Bus Cabin */}
            <div className="bus-cabin">
              <div className="cabin-front">
                <span>🚪 ENTRANCE</span>
                <span>🚌 DRIVER</span>
              </div>
              <div className="seat-map-grid">
                {rows.map(({ rowLetter, seats }) => (
                  <div key={rowLetter} className="seat-row-view">
                    <div className="row-label">{rowLetter}</div>
                    <div className="seat-pair">
                      {seats.slice(0, 2).map((s) => s && (
                        <div
                          key={s.seatId}
                          className={[
                            'seat-cell',
                            s.isBooked ? 'booked' : 'avail',
                            activeSeat === s.seatId ? 'seat-active' : '',
                            s.isBooked ? 'seat-clickable' : '',
                          ].join(' ').trim()}
                          title={s.isBooked
                            ? `Seat ${s.seatId}: Click to view passenger`
                            : `Seat ${s.seatId}: Available`}
                          onClick={() => handleSeatClick(s)}
                        >
                          <span>{s.seatId}</span>
                          <span className="seat-tag">{s.isBooked ? 'Booked' : 'Open'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="aisle-gap">||</div>
                    <div className="seat-pair">
                      {seats.slice(2, 4).map((s) => s ? (
                        <div
                          key={s.seatId}
                          className={[
                            'seat-cell',
                            s.isBooked ? 'booked' : 'avail',
                            activeSeat === s.seatId ? 'seat-active' : '',
                            s.isBooked ? 'seat-clickable' : '',
                          ].join(' ').trim()}
                          title={s.isBooked
                            ? `Seat ${s.seatId}: Click to view passenger`
                            : `Seat ${s.seatId}: Available`}
                          onClick={() => handleSeatClick(s)}
                        >
                          <span>{s.seatId}</span>
                          <span className="seat-tag">{s.isBooked ? 'Booked' : 'Open'}</span>
                        </div>
                      ) : (
                        <div key={`blank-${rowLetter}-last`} style={{ width: 42 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary strip */}
            <div className="seat-summary-strip">
              <div className="seat-summary-item green">
                <span className="seat-summary-num">{availCount}</span>
                <span className="seat-summary-lbl">Available</span>
              </div>
              <div className="seat-summary-item red">
                <span className="seat-summary-num">{bookedCount}</span>
                <span className="seat-summary-lbl">Booked</span>
              </div>
              <div className="seat-summary-item blue">
                <span className="seat-summary-num">{total}</span>
                <span className="seat-summary-lbl">Total</span>
              </div>
              <div className="seat-summary-item orange">
                <span className="seat-summary-num">
                  {total > 0 ? Math.round((bookedCount / total) * 100) : 0}%
                </span>
                <span className="seat-summary-lbl">Occupancy</span>
              </div>
            </div>
          </div>

          {/* Right: Passenger Drawer */}
          {activeSeat && (
            <PassengerDrawer
              seat={activeSeat}
              passenger={selectedPassenger}
              onClose={() => setActiveSeat(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main SeatManagement page
   ───────────────────────────────────────────────────────────── */
export default function SeatManagement({ provider }) {
  const [buses, setBuses]             = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);

  useEffect(() => {
    setBuses(getSeatData());
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Fleet Seat Occupancy &amp; Layouts</h3>
          <p>Click on any bus to view its interactive seat map. Click a booked seat to see passenger details.</p>
        </div>
      </div>

      {buses.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚌</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>No buses found</h3>
          <p>Add a schedule first to see seat layout and passenger details here.</p>
        </div>
      )}

      {buses.map((bus) => {
        const bookedCount = bus.bookedSeatList.length;
        const totalSeats  = bus.total || 40;
        const pct         = Math.min(100, Math.round((bookedCount / totalSeats) * 100));
        const barClass    = pct >= 100 ? 'red' : pct >= 70 ? 'orange' : 'green';

        return (
          <div key={bus.id} className="seat-mg-card" onClick={() => setSelectedBus(bus)}>
            <div className="seat-mg-header">
              <div>
                <div className="seat-mg-title">{bus.route}</div>
                <div className="seat-mg-sub">{bus.time} · {bus.name} ({bus.type})</div>
              </div>
              <div>
                <div className="seat-mg-count">{bookedCount}/{totalSeats}</div>
                <div className="seat-mg-label">Booked/Total ({pct}%)</div>
              </div>
            </div>
            <div className="seat-mg-progress">
              <div className={`seat-mg-bar ${barClass}`} style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {totalSeats - bookedCount} seats currently available
                {bookedCount > 0 && ` · ${bookedCount} passenger${bookedCount > 1 ? 's' : ''} booked`}
              </span>
              <button
                className="btn-view-seats"
                onClick={(e) => { e.stopPropagation(); setSelectedBus(bus); }}
              >
                💺 View Seat Layout &amp; Status
              </button>
            </div>
          </div>
        );
      })}

      {selectedBus && (
        <SeatModal bus={selectedBus} onClose={() => setSelectedBus(null)} />
      )}
    </div>
  );
}
