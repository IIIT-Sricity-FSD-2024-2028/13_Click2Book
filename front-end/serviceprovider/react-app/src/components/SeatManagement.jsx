import React, { useState, useEffect } from 'react';
import { getSeatData } from '../services/api';

function SeatModal({ bus, onClose }) {
  if (!bus) return null;
  const { name, type, route, total = 40, bookedSeatList = [] } = bus;
  const bookedCount = bookedSeatList.length;
  const availCount  = Math.max(0, total - bookedCount);
  const totalRows   = Math.ceil(total / 4);

  const rows = Array.from({ length: totalRows }, (_, r) => {
    const rowLetter = String.fromCharCode(65 + r);
    return { rowLetter, seats: [1, 2, 3, 4].map((col) => {
      const seatNum = r * 4 + col;
      if (seatNum > total) return null;
      const seatId = `${rowLetter}${col}`;
      return { seatId, isBooked: bookedSeatList.includes(seatId) };
    })};
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <div className="modal-title">🚍 {name} ({type})</div>
            <div className="modal-sub">{route} · Total: {total} Seats</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body-scroll">
          <div className="seat-legend">
            <div className="legend-item">
              <div className="legend-box avail" />
              Available ({availCount})
            </div>
            <div className="legend-item">
              <div className="legend-box booked" />
              Booked ({bookedCount})
            </div>
          </div>
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
                      <div key={s.seatId} className={`seat-cell ${s.isBooked ? 'booked' : 'avail'}`} title={`Seat ${s.seatId}: ${s.isBooked ? 'Booked' : 'Available'}`}>
                        <span>{s.seatId}</span>
                        <span className="seat-tag">{s.isBooked ? 'Booked' : 'Open'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="aisle-gap">||</div>
                  <div className="seat-pair">
                    {seats.slice(2, 4).map((s) => s ? (
                      <div key={s.seatId} className={`seat-cell ${s.isBooked ? 'booked' : 'avail'}`} title={`Seat ${s.seatId}: ${s.isBooked ? 'Booked' : 'Available'}`}>
                        <span>{s.seatId}</span>
                        <span className="seat-tag">{s.isBooked ? 'Booked' : 'Open'}</span>
                      </div>
                    ) : <div key={`blank-${rowLetter}-${s}`} style={{ width: 42 }} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeatManagement({ provider }) {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);

  useEffect(() => {
    setBuses(getSeatData());
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Fleet Seat Occupancy &amp; Layouts</h3>
          <p>Click on any bus to view its interactive seat map with real-time booked seats</p>
        </div>
      </div>

      {buses.map((bus) => {
        const bookedCount = bus.bookedSeatList.length;
        const totalSeats  = bus.total || 40;
        const pct = Math.min(100, Math.round((bookedCount / totalSeats) * 100));
        const barClass = pct >= 100 ? 'red' : pct >= 70 ? 'orange' : 'green';

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
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{totalSeats - bookedCount} seats currently available</span>
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

      {selectedBus && <SeatModal bus={selectedBus} onClose={() => setSelectedBus(null)} />}
    </div>
  );
}
