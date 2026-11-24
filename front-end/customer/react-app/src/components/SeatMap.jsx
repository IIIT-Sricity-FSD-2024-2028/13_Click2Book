import React, { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   STEERING WHEEL SVG
───────────────────────────────────────────────────────────────────────── */
function SteeringWheelIcon() {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke="#64748b" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="20" r="7" stroke="#64748b" strokeWidth="2" fill="none" />
      <line x1="20" y1="13" x2="20" y2="3" stroke="#64748b" strokeWidth="2.5" />
      <line x1="13" y1="20" x2="3" y2="20" stroke="#64748b" strokeWidth="2.5" />
      <line x1="27" y1="20" x2="37" y2="20" stroke="#64748b" strokeWidth="2.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SLEEPER BERTH SVG  –  horizontal rectangle 68×34 px with pillow headrest
───────────────────────────────────────────────────────────────────────── */
function SleeperBerthSvg({ seatId, pillowColor, strokeColor, fillColor }) {
  const safeId = String(seatId || '').replace(/\W/g, '_');
  const clipId = `clip_sl_${safeId}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="68"
      height="34"
      viewBox="0 0 70 35"
      fill="none"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M5 35C2.239 35 0 32.761 0 30L0 5C0 2.239 2.239 0 5 0L65 0C67.761 0 70 2.239 70 5V30C70 32.761 67.761 35 65 35L5 35Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5 35C2.239 35 0 32.761 0 30L0 5C0 2.239 2.239 0 5 0L65 0C67.761 0 70 2.239 70 5V30C70 32.761 67.761 35 65 35L5 35Z"
          fill={fillColor}
        />
        {/* Pillow headrest strip on right end */}
        <rect x="57" y="4" width="9" height="27" rx="3.5" fill={pillowColor} />
      </g>
      <path
        d="M0.75 30L0.75 5C0.75 2.653 2.653 0.75 5 0.75L65 0.75C67.347 0.75 69.25 2.653 69.25 5V30C69.25 32.347 67.347 34.25 65 34.25L5 34.25C2.653 34.25 0.75 32.347 0.75 30Z"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SEATER / CHAIR SVG  –  upright chair 38×42 px with headrest & armrests
───────────────────────────────────────────────────────────────────────── */
function SeaterSeatSvg({ pillowColor, strokeColor, fillColor }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="38"
      height="42"
      viewBox="0 0 40 44"
      fill="none"
    >
      <rect x="8" y="2" width="24" height="7" rx="3.5" fill={pillowColor} />
      <rect
        x="6"
        y="8"
        width="28"
        height="22"
        rx="5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <rect
        x="6"
        y="28"
        width="28"
        height="12"
        rx="4"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <rect x="1" y="28" width="6" height="10" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
      <rect x="33" y="28" width="6" height="10" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
    </svg>
  );
}

export default function SeatMap({
  bus,
  selectedSeats = [],
  onToggleSeat,
  bookedSeats = [],
  onProceed,
  onBack,
}) {
  const [selectedDeck, setSelectedDeck] = useState('LOWER');

  const busType = bus?.vehicleType || bus?.busType || 'AC Sleeper';
  const typeStr = busType.toLowerCase();
  const isSleeper =
    (typeStr.includes('sleeper') && !typeStr.includes('semi')) ||
    Boolean(bus?.seatLayout?.hasUpperDeck) ||
    Boolean(bus?.seatLayout?.upperDeck && bus.seatLayout.upperDeck.length > 0);

  const totalSeats = Number(bus?.totalSeats || bus?.seatLayout?.totalSeats || (isSleeper ? 30 : 40));
  const fare = Number(bus?.price || bus?.fare || 650);

  // Normalization helper for checking booked/selected status
  const cleanId = (s) => String(s || '').trim().toUpperCase();
  const bookedSet = new Set(bookedSeats.map(cleanId));
  const selectedSet = new Set(selectedSeats.map(cleanId));

  const isSeatBooked = (id) => bookedSet.has(cleanId(id));
  const isSeatSelected = (id) => selectedSet.has(cleanId(id));

  /* ─────────────────────────────────────────────────────────────────────────
     RESOLVE SEAT LAYOUT (From bus.seatLayout or dynamic fallback)
  ───────────────────────────────────────────────────────────────────────── */
  const layout = bus?.seatLayout;

  // Build sleeper rows dynamically if layout arrays not pre-populated
  const halfSeats = Math.ceil(totalSeats / 2);
  const upperHalfSeats = totalSeats - halfSeats;

  // Helper to build 2+1 sleeper deck rows
  const buildSleeperDeckRows = (prefix, count) => {
    const rows = [];
    const rowCount = Math.max(1, Math.ceil(count / 3));
    for (let r = 0; r < rowCount; r++) {
      const n1 = r * 3 + 1;
      const n2 = r * 3 + 2;
      const n3 = r * 3 + 3;
      rows.push({
        rowIdx: r + 1,
        leftSeats: [n1 <= count ? `${prefix}${n1}` : null, n2 <= count ? `${prefix}${n2}` : null].filter(Boolean),
        rightSeats: [n3 <= count ? `${prefix}${n3}` : null].filter(Boolean),
      });
    }
    return rows;
  };

  // Helper to build 2+2 seater rows
  const buildSeaterRows = (count) => {
    const rows = [];
    const rowCount = Math.max(1, Math.ceil(count / 4));
    for (let r = 0; r < rowCount; r++) {
      const letter = String.fromCharCode(65 + (r % 26));
      const n1 = r * 4 + 1;
      const n2 = r * 4 + 2;
      const n3 = r * 4 + 3;
      const n4 = r * 4 + 4;
      rows.push({
        letter,
        leftSeats: [n1 <= count ? `${letter}1` : null, n2 <= count ? `${letter}2` : null].filter(Boolean),
        rightSeats: [n3 <= count ? `${letter}3` : null, n4 <= count ? `${letter}4` : null].filter(Boolean),
      });
    }
    return rows;
  };

  // Check if configured seatLayout has lowerDeck / upperDeck arrays
  const hasConfiguredLower = Array.isArray(layout?.lowerDeck) && layout.lowerDeck.some((s) => s.isActive);
  const hasConfiguredUpper = Array.isArray(layout?.upperDeck) && layout.upperDeck.some((s) => s.isActive);

  // Group configured deck items by row
  const groupDeckByRow = (deckItems) => {
    const activeItems = (deckItems || []).filter((s) => s.isActive && s.seatNumber);
    const rowMap = new Map();
    activeItems.forEach((item) => {
      const r = item.row || 1;
      if (!rowMap.has(r)) rowMap.set(r, []);
      rowMap.get(r).push(item);
    });

    return Array.from(rowMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([r, items]) => {
        const sorted = items.sort((a, b) => (a.col || 0) - (b.col || 0));
        const left = sorted.filter((s) => (s.col || 1) <= 2).map((s) => s.seatNumber);
        const right = sorted.filter((s) => (s.col || 1) > 2).map((s) => s.seatNumber);
        return {
          rowIdx: r,
          letter: String.fromCharCode(64 + Number(r)),
          leftSeats: left,
          rightSeats: right,
        };
      });
  };

  const lowerRows = hasConfiguredLower
    ? groupDeckByRow(layout.lowerDeck)
    : isSleeper
    ? buildSleeperDeckRows('L', halfSeats)
    : buildSeaterRows(totalSeats);

  const upperRows = hasConfiguredUpper
    ? groupDeckByRow(layout.upperDeck)
    : isSleeper
    ? buildSleeperDeckRows('U', upperHalfSeats)
    : [];

  const activeRows = isSleeper && selectedDeck === 'UPPER' ? upperRows : lowerRows;

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER INDIVIDUAL SEAT
  ───────────────────────────────────────────────────────────────────────── */
  const renderSeat = (seatId, isSleeperType) => {
    if (!seatId) return null;
    const isBooked = isSeatBooked(seatId);
    const isSelected = isSeatSelected(seatId);

    let fillColor = '#FFFFFF';
    let pillowColor = '#C8CAD0';
    let strokeColor = '#C8CAD0';

    if (isSelected) {
      fillColor = '#EFF6FF';
      pillowColor = '#f97316';
      strokeColor = '#f97316';
    } else if (isBooked) {
      fillColor = '#D6D7DB';
      pillowColor = '#94a3b8';
      strokeColor = '#C8CAD0';
    }

    return (
      <button
        key={seatId}
        type="button"
        disabled={isBooked}
        onClick={() => !isBooked && onToggleSeat(seatId)}
        title={
          isBooked
            ? `Seat ${seatId} (Already Booked)`
            : isSelected
            ? `Seat ${seatId} (Selected - Click to deselect)`
            : `Seat ${seatId} (Available · ₹${fare} - Click to select)`
        }
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          background: isSelected ? '#fff7ed' : 'transparent',
          border: isSelected ? '1.5px solid #f97316' : '1.5px solid transparent',
          borderRadius: 8,
          padding: '4px 6px',
          cursor: isBooked ? 'not-allowed' : 'pointer',
          opacity: isBooked ? 0.7 : 1,
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        {isSleeperType ? (
          <SleeperBerthSvg
            seatId={seatId}
            fillColor={fillColor}
            pillowColor={pillowColor}
            strokeColor={strokeColor}
          />
        ) : (
          <SeaterSeatSvg
            fillColor={fillColor}
            pillowColor={pillowColor}
            strokeColor={strokeColor}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: isSelected ? '#ea580c' : isBooked ? '#64748b' : '#334155',
            }}
          >
            {seatId}
          </span>
          {!isBooked && (
            <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>
              ₹{fare}
            </span>
          )}
        </div>
      </button>
    );
  };

  const totalSelectedPrice = selectedSeats.length * fare;

  return (
    <div>
      {/* ── Top Stepper ── */}
      <div className="stepper-row">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div className="stepper">
          <div className="step-item done">
            <div className="step-circle done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="step-label">Select Bus</span>
          </div>
          <div className="step-line done" />
          <div className="step-item active">
            <div className="step-circle active">3</div>
            <span className="step-label active-lbl">Choose Seat</span>
          </div>
          <div className="step-line" />
          <div className="step-item">
            <div className="step-circle">4</div>
            <span className="step-label">Passenger Info</span>
          </div>
          <div className="step-line" />
          <div className="step-item">
            <div className="step-circle">5</div>
            <span className="step-label">Payment</span>
          </div>
        </div>
      </div>

      {/* ── Seat Map Outer Card ── */}
      <div className="seat-map-outer" style={{ maxWidth: isSleeper ? 640 : 560 }}>
        <h1 className="seat-heading">Choose Your Seats</h1>
        <p className="seat-subheading" id="seatSubheading">
          <strong>{bus?.busName || 'Express Coach'}</strong>
          {bus?.vehicleNumber ? ` (${bus.vehicleNumber})` : ''} · {busType} · {totalSeats} Total Seats · ₹{fare} per seat
        </p>

        {/* ── Deck Switcher (For Sleeper buses) ── */}
        {isSleeper && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setSelectedDeck('LOWER')}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: 10,
                border: selectedDeck === 'LOWER' ? '2px solid #f97316' : '1.5px solid #cbd5e1',
                background: selectedDeck === 'LOWER' ? '#fff7ed' : '#ffffff',
                color: selectedDeck === 'LOWER' ? '#ea580c' : '#475569',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span>🛏️ Lower Deck</span>
              <span
                style={{
                  background: selectedDeck === 'LOWER' ? '#ea580c' : '#e2e8f0',
                  color: selectedDeck === 'LOWER' ? '#ffffff' : '#475569',
                  borderRadius: 20,
                  padding: '1px 8px',
                  fontSize: '0.72rem',
                }}
              >
                {halfSeats} Berths
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDeck('UPPER')}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: 10,
                border: selectedDeck === 'UPPER' ? '2px solid #f97316' : '1.5px solid #cbd5e1',
                background: selectedDeck === 'UPPER' ? '#fff7ed' : '#ffffff',
                color: selectedDeck === 'UPPER' ? '#ea580c' : '#475569',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span>🛏️ Upper Deck</span>
              <span
                style={{
                  background: selectedDeck === 'UPPER' ? '#ea580c' : '#e2e8f0',
                  color: selectedDeck === 'UPPER' ? '#ffffff' : '#475569',
                  borderRadius: 20,
                  padding: '1px 8px',
                  fontSize: '0.72rem',
                }}
              >
                {upperHalfSeats} Berths
              </span>
            </button>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-dot available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot selected" />
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot booked" />
            <span>Booked / Unavailable</span>
          </div>
        </div>

        {/* ── Bus Coach Body ── */}
        <div className="bus-body" style={{ background: '#f8fafc', padding: '16px 20px' }}>
          {/* Driver Cabin Row */}
          <div className="driver-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isSleeper ? (selectedDeck === 'LOWER' ? '⬇️ Lower Deck Layout' : '⬆️ Upper Deck Layout') : '🚌 Coach Seating Layout'}
            </span>
            <div className="driver-chip" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SteeringWheelIcon />
              <span>Driver Cabin</span>
            </div>
          </div>

          <div
            id="seatGrid"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 12,
              padding: '12px 6px',
            }}
          >
            {activeRows.map((row, idx) => (
              <div
                key={row.letter || row.rowIdx || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: idx < activeRows.length - 1 ? '1px dashed #e2e8f0' : 'none',
                }}
              >
                {/* Left Side Seats (2 seats or 1 sleeper berth) */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {row.leftSeats.map((sId) => renderSeat(sId, isSleeper))}
                  {row.leftSeats.length === 1 && !isSleeper && (
                    <div style={{ width: 44, height: 44 }} />
                  )}
                </div>

                {/* Center Aisle Gangway */}
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    color: '#cbd5e1',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                  }}
                >
                  <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                    AISLE
                  </span>
                </div>

                {/* Right Side Seats (2 seats or 1 sleeper berth) */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {row.rightSeats.map((sId) => renderSeat(sId, isSleeper))}
                  {row.rightSeats.length === 1 && !isSleeper && (
                    <div style={{ width: 44, height: 44 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seats summary inside card */}
        {selectedSeats.length > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#c2410c', fontWeight: 600 }}>
                Selected Seat{selectedSeats.length > 1 ? 's' : ''}:
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#9a3412' }}>
                {selectedSeats.join(', ')} ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Fare:</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ea580c' }}>
                ₹{totalSelectedPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Proceed Button Below the Card ── */}
      <div className="seat-proceed-wrap" style={{ maxWidth: isSleeper ? 640 : 560 }}>
        <button
          className="proceed-btn"
          id="proceedSeatBtn"
          disabled={selectedSeats.length === 0}
          onClick={onProceed}
        >
          {selectedSeats.length === 0
            ? 'Select Seats to Proceed'
            : `Proceed to Book (${selectedSeats.join(', ')}) · ₹${totalSelectedPrice.toLocaleString('en-IN')}`}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-6-7 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
