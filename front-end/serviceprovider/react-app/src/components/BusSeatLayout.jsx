import React, { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   STEERING WHEEL SVG
   Simple circle-based steering wheel per specification.
───────────────────────────────────────────────────────────────────────── */
function SteeringWheelIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#64748b" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="20" r="8"  stroke="#64748b" strokeWidth="2.5" fill="none" />
      <line x1="20" y1="12" x2="20" y2="4"  stroke="#64748b" strokeWidth="2.5" />
      <line x1="12" y1="20" x2="4"  y2="20" stroke="#64748b" strokeWidth="2.5" />
      <line x1="28" y1="20" x2="36" y2="20" stroke="#64748b" strokeWidth="2.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SLEEPER BERTH SVG  –  horizontal rectangle 70×35 px
   Pillow headrest: small vertical rect on the right end.
───────────────────────────────────────────────────────────────────────── */
function SleeperBerthSvg({ seatId, pillowColor, strokeColor, fillColor }) {
  const safeId = String(seatId || '').replace(/\W/g, '_');
  const clipId = `clip_sl_${safeId}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="70"
      height="35"
      viewBox="0 0 70 35"
      fill="none"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M5 35C2.239 35 0 32.761 0 30L0 5C0 2.239 2.239 0 5 0L65 0C67.761 0 70 2.239 70 5V30C70 32.761 67.761 35 65 35L5 35Z" />
        </clipPath>
      </defs>
      {/* Body */}
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5 35C2.239 35 0 32.761 0 30L0 5C0 2.239 2.239 0 5 0L65 0C67.761 0 70 2.239 70 5V30C70 32.761 67.761 35 65 35L5 35Z"
          fill={fillColor}
        />
        {/* Pillow headrest – right side vertical strip */}
        <rect x="58" y="4" width="8" height="27" rx="3.5" fill={pillowColor} />
      </g>
      {/* Border */}
      <path
        d="M0.75 30L0.75 5C0.75 2.653 2.653 0.75 5 0.75L65 0.75C67.347 0.75 69.25 2.653 69.25 5V30C69.25 32.347 67.347 34.25 65 34.25L5 34.25C2.653 34.25 0.75 32.347 0.75 30Z"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SEATER / SEMI-SLEEPER SEAT SVG  –  upright chair 40×44 px
   Headrest bar at top, two armrests on sides.
───────────────────────────────────────────────────────────────────────── */
function SeaterSeatSvg({ pillowColor, strokeColor, fillColor }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="44"
      viewBox="0 0 40 44"
      fill="none"
    >
      {/* Headrest bar */}
      <rect x="8" y="2" width="24" height="7" rx="3.5" fill={pillowColor} />
      {/* Seat back */}
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
      {/* Seat cushion */}
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
      {/* Left armrest */}
      <rect x="1" y="28" width="6" height="10" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
      {/* Right armrest */}
      <rect x="33" y="28" width="6" height="10" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LEGEND STRIP
───────────────────────────────────────────────────────────────────────── */
function LegendStrip() {
  const chips = [
    { label: 'Available',       body: '#FFFFFF', pillow: '#C8CAD0', border: '#C8CAD0' },
    { label: 'Booked (Male)',   body: '#D6D7DB', pillow: '#848794', border: '#C8CAD0' },
    { label: 'Booked (Female)', body: '#D6D7DB', pillow: '#F06292', border: '#C8CAD0' },
    { label: 'Selected',        body: '#EFF6FF', pillow: '#499AF5', border: '#499AF5' },
    { label: 'Blocked',         body: '#FFF7ED', pillow: '#FCD34D', border: '#FCD34D' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '12px',
        padding: '10px 14px',
        background: '#f1f5f9',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
      }}
    >
      {chips.map(({ label, body, pillow, border }) => (
        <div
          key={label}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#475569' }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: 3,
              background: body,
              border: `2px solid ${border}`,
              boxShadow: `inset -4px 0 0 ${pillow}`,
              flexShrink: 0,
            }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function BusSeatLayout({
  busType       = 'Seater',
  fare          = 650,
  totalSeats    = 40,
  bookedSeatList = [],
  passengerMap   = {},
  activeSeat     = null,
  onSeatClick    = null,
  isPreview      = false,
  blockedSeats   = [],
}) {
  const typeStr = (busType || '').toLowerCase();
  const isSleeper = typeStr.includes('sleeper') && !typeStr.includes('semi');
  const isSemi    = typeStr.includes('semi');
  // Everything else (Seater, AC Seater, Volvo AC, Non-AC, Luxury) is seater

  const [selectedDeck, setSelectedDeck] = useState('LOWER');

  const effectiveFare = Number(fare) > 0 ? Number(fare) : 650;
  const seatCount     = Number(totalSeats) > 0 ? Number(totalSeats) : 40;

  /* ───────── Seat visual state helper ───────── */
  const getSeatVisuals = (seatId) => {
    if (!seatId) return null;

    const isBooked   = !isPreview && Array.isArray(bookedSeatList) && bookedSeatList.includes(seatId);
    const isBlocked  = !isPreview && Array.isArray(blockedSeats) && blockedSeats.includes(seatId);
    const isSelected = !isPreview && activeSeat === seatId;
    const passenger  = (passengerMap && typeof passengerMap === 'object') ? (passengerMap[seatId] || null) : null;
    const isFemale   = passenger?.gender?.toLowerCase() === 'female';

    let fillColor, pillowColor, strokeColor;

    if (isSelected) {
      fillColor   = '#EFF6FF';
      pillowColor = '#499AF5';
      strokeColor = '#499AF5';
    } else if (isBlocked) {
      fillColor   = '#FFF7ED';
      pillowColor = '#FCD34D';
      strokeColor = '#FCD34D';
    } else if (isBooked) {
      fillColor   = '#D6D7DB';
      pillowColor = isFemale ? '#F06292' : '#848794';
      strokeColor = '#C8CAD0';
    } else {
      // Available
      fillColor   = '#FFFFFF';
      pillowColor = '#C8CAD0';
      strokeColor = '#C8CAD0';
    }

    const stateLabel = isSelected ? 'Selected'
      : isBlocked ? 'Blocked'
      : isBooked  ? `Booked · ${isFemale ? 'Female' : 'Male/General'}`
      : 'Available';

    return {
      seatId,
      isBooked,
      isBlocked,
      isSelected,
      passenger,
      fillColor,
      pillowColor,
      strokeColor,
      stateLabel,
    };
  };

  /* ───────── Click handler ───────── */
  const handleSeatClick = (seatObj) => {
    if (!seatObj || isPreview) return;
    if (typeof onSeatClick === 'function') {
      onSeatClick({
        seatId:     seatObj.seatId,
        isBooked:   seatObj.isBooked,
        isBlocked:  seatObj.isBlocked,
        isSelected: seatObj.isSelected,
        passenger:  seatObj.passenger,
      });
    }
  };

  /* ───────── Gangway cell ───────── */
  const GangwayCell = ({ rowSpan = 1 }) => (
    <td
      className="v1-gangway"
      rowSpan={rowSpan}
      style={{ width: 28, textAlign: 'center', verticalAlign: 'middle' }}
    >
      <div
        style={{
          width: 2,
          background: '#e2e8f0',
          height: '100%',
          margin: '0 auto',
          minHeight: 40,
        }}
      />
    </td>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     SLEEPER LAYOUT  –  Lower/Upper decks, 2+1 per row (L/U prefix IDs)
  ═══════════════════════════════════════════════════════════════════════ */
  const halfSeats      = Math.ceil(seatCount / 2);
  const upperHalfSeats = seatCount - halfSeats;
  const sleeperRows    = Math.max(1, Math.ceil(halfSeats / 3));

  // Build deck rows: each row has seats [left1, left2, right1]
  const buildSleeperRows = (prefix, count) => {
    const rows = [];
    const rowCount = Math.max(1, Math.ceil(count / 3));
    for (let r = 0; r < rowCount; r++) {
      const n1 = r * 3 + 1;
      const n2 = r * 3 + 2;
      const n3 = r * 3 + 3;
      rows.push({
        idx: r + 1,
        seats: [
          n1 <= count ? `${prefix}${n1}` : null,
          n2 <= count ? `${prefix}${n2}` : null,
          n3 <= count ? `${prefix}${n3}` : null,
        ],
      });
    }
    return rows;
  };

  const lowerRows = buildSleeperRows('L', halfSeats);
  const upperRows = buildSleeperRows('U', upperHalfSeats);
  const activeDeckRows = selectedDeck === 'LOWER' ? lowerRows : upperRows;

  const renderSleeperSeatCell = (seatId, rowSpan = 1) => {
    const sv = getSeatVisuals(seatId);
    if (!sv) return <td rowSpan={rowSpan} className="v1-seat-cell v1-empty-cell" />;

    return (
      <td rowSpan={rowSpan} className="v1-seat-cell" style={{ padding: '4px 3px', verticalAlign: 'middle' }}>
        <button
          type="button"
          disabled={isPreview}
          onClick={() => handleSeatClick(sv)}
          title={`Seat ${sv.seatId} · ₹${effectiveFare} · ${sv.stateLabel}`}
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            2,
            background:     'transparent',
            border:         'none',
            cursor:         isPreview ? 'default' : 'pointer',
            padding:        0,
            outline:        'none',
          }}
        >
          <SleeperBerthSvg
            seatId={sv.seatId}
            fillColor={sv.fillColor}
            pillowColor={sv.pillowColor}
            strokeColor={sv.strokeColor}
          />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#374151', lineHeight: 1 }}>
            {sv.seatId}
          </span>
          {!sv.isBooked && (
            <span style={{ fontSize: '0.6rem', color: '#6b7280', lineHeight: 1 }}>
              ₹{effectiveFare}
            </span>
          )}
        </button>
      </td>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════
     SEATER / SEMI-SLEEPER LAYOUT  –  2+2 arrangement, row-letter IDs
  ═══════════════════════════════════════════════════════════════════════ */
  const seaterRowCount = Math.max(1, Math.ceil(seatCount / 4));
  const seaterRows = [];
  for (let r = 0; r < seaterRowCount; r++) {
    const letter = String.fromCharCode(65 + (r % 26));
    const n1 = r * 4 + 1, n2 = r * 4 + 2, n3 = r * 4 + 3, n4 = r * 4 + 4;
    seaterRows.push({
      letter,
      seats: [
        n1 <= seatCount ? `${letter}1` : null,
        n2 <= seatCount ? `${letter}2` : null,
        n3 <= seatCount ? `${letter}3` : null,
        n4 <= seatCount ? `${letter}4` : null,
      ],
    });
  }

  const renderSeaterSeatCell = (seatId) => {
    const sv = getSeatVisuals(seatId);
    if (!sv) return <td className="v1-seat-cell v1-empty-cell" />;

    return (
      <td className="v1-seat-cell" style={{ padding: '4px 3px', verticalAlign: 'bottom' }}>
        <button
          type="button"
          disabled={isPreview}
          onClick={() => handleSeatClick(sv)}
          title={`Seat ${sv.seatId} · ₹${effectiveFare} · ${sv.stateLabel}`}
          style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           2,
            background:    'transparent',
            border:        'none',
            cursor:        isPreview ? 'default' : 'pointer',
            padding:       0,
            outline:       'none',
          }}
        >
          <SeaterSeatSvg
            fillColor={sv.fillColor}
            pillowColor={sv.pillowColor}
            strokeColor={sv.strokeColor}
          />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#374151', lineHeight: 1 }}>
            {sv.seatId}
          </span>
          <span style={{ fontSize: '0.6rem', color: '#6b7280', lineHeight: 1 }}>
            ₹{effectiveFare}
          </span>
        </button>
      </td>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Deck tabs (Sleeper only) ── */}
      {isSleeper && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { key: 'LOWER', label: 'Lower Deck', count: halfSeats },
            { key: 'UPPER', label: 'Upper Deck', count: upperHalfSeats },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDeck(key)}
              style={{
                padding:       '6px 16px',
                borderRadius:  8,
                border:        `2px solid ${selectedDeck === key ? '#3b82f6' : '#cbd5e1'}`,
                background:    selectedDeck === key ? '#eff6ff' : '#f8fafc',
                color:         selectedDeck === key ? '#1d4ed8' : '#64748b',
                fontWeight:    selectedDeck === key ? 700 : 500,
                fontSize:      '0.8rem',
                cursor:        'pointer',
                display:       'flex',
                alignItems:    'center',
                gap:           6,
              }}
            >
              🛏️ {label}
              <span
                style={{
                  background:   selectedDeck === key ? '#3b82f6' : '#e2e8f0',
                  color:        selectedDeck === key ? '#fff' : '#64748b',
                  borderRadius: 20,
                  padding:      '1px 7px',
                  fontSize:     '0.7rem',
                  fontWeight:   700,
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Bus cabin container ── */}
      <div
        data-testid="SeatLayoutV1"
        style={{
          display:        'flex',
          flexDirection:  'row',
          alignItems:     'flex-start',
          gap:            12,
          padding:        '1rem',
          background:     '#f8fafc',
          border:         '1.5px solid #cbd5e1',
          borderRadius:   16,
          overflowX:      'auto',
        }}
      >
        {/* Steering wheel */}
        <div
          id="steering-wheel"
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            6,
            padding:        '8px 14px',
            borderRight:    '2px dashed #cbd5e1',
            marginRight:    4,
            flexShrink:     0,
          }}
        >
          <SteeringWheelIcon />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            DRIVER
          </span>
        </div>

        {/* ── SLEEPER TABLE ── */}
        {isSleeper && (
          <table style={{ borderCollapse: 'separate', borderSpacing: '4px 4px' }}>
            <tbody>
              {activeDeckRows.map((row) => (
                <React.Fragment key={`sl-row-${row.idx}`}>
                  {/* Top sub-row: left1, gangway, right */}
                  <tr>
                    {renderSleeperSeatCell(row.seats[0], 2)}
                    {renderSleeperSeatCell(row.seats[1], 2)}
                    <GangwayCell rowSpan={2} />
                    {renderSleeperSeatCell(row.seats[2], 2)}
                  </tr>
                  {/* Bottom sub-row (spacer for rowSpan alignment) */}
                  <tr style={{ height: 4 }} />
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* ── SEATER / SEMI-SLEEPER TABLE ── */}
        {!isSleeper && (
          <table style={{ borderCollapse: 'separate', borderSpacing: '4px 6px' }}>
            <tbody>
              {seaterRows.map((row) => (
                <tr key={`seat-row-${row.letter}`}>
                  {renderSeaterSeatCell(row.seats[0])}
                  {renderSeaterSeatCell(row.seats[1])}
                  <GangwayCell />
                  {renderSeaterSeatCell(row.seats[2])}
                  {renderSeaterSeatCell(row.seats[3])}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Legend ── */}
      <LegendStrip />
    </div>
  );
}
