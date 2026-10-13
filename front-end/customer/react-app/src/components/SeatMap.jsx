import React from 'react';

export default function SeatMap({
  bus,
  selectedSeats,
  onToggleSeat,
  bookedSeats = [],
  onProceed,
  onBack,
}) {
  const totalSeats = bus?.totalSeats || 40;
  const totalRows = Math.ceil(totalSeats / 4);

  const rows = [];
  for (let r = 0; r < totalRows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const rowSeats = [];
    for (let col = 1; col <= 4; col++) {
      const seatNum = r * 4 + col;
      if (seatNum <= totalSeats) {
        rowSeats.push({
          id: `${rowLetter}${col}`,
          num: seatNum,
        });
      }
    }
    rows.push({ letter: rowLetter, seats: rowSeats });
  }

  return (
    <div>
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

      {/* Seat map outer card */}
      <div className="seat-map-outer">
        <h1 className="seat-heading">Choose Your Seats</h1>
        <p className="seat-subheading" id="seatSubheading">
          {bus?.busName || 'Royal Express'} · {bus?.vehicleType || bus?.busType || 'Sleeper AC'} · ({totalSeats} Total Seats) · Select one or more seats
        </p>

        {/* Legend */}
        <div className="seat-legend">
          <div className="legend-item"><div className="legend-dot available" /><span>Available</span></div>
          <div className="legend-item"><div className="legend-dot selected" /><span>Selected</span></div>
          <div className="legend-item"><div className="legend-dot booked" /><span>Booked</span></div>
        </div>

        {/* Bus body */}
        <div className="bus-body">
          <div className="driver-row">
            <div className="driver-chip">🚌 Driver</div>
          </div>
          <div id="seatGrid">
            {rows.map((row) => {
              const leftSeats = row.seats.filter((s) => s.id.endsWith('1') || s.id.endsWith('2'));
              const rightSeats = row.seats.filter((s) => s.id.endsWith('3') || s.id.endsWith('4'));

              return (
                <div key={row.letter} className="seat-row">
                  <span className="row-label">{row.letter}</span>
                  <div className="seat-pair">
                    {leftSeats.map((seat) => {
                      const isBooked = bookedSeats.includes(seat.id);
                      const isSelected = selectedSeats.includes(seat.id);
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => onToggleSeat(seat.id)}
                          className={`seat ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                          title={isBooked ? `Seat ${seat.id} (Booked)` : `Seat ${seat.id} (Available - Click to select)`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                    {leftSeats.length === 1 && <div style={{ width: 40, height: 40 }} />}
                  </div>

                  <div className="seat-aisle" />

                  <div className="seat-pair">
                    {rightSeats.map((seat) => {
                      const isBooked = bookedSeats.includes(seat.id);
                      const isSelected = selectedSeats.includes(seat.id);
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => onToggleSeat(seat.id)}
                          className={`seat ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                          title={isBooked ? `Seat ${seat.id} (Booked)` : `Seat ${seat.id} (Available - Click to select)`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                    {rightSeats.length === 1 && <div style={{ width: 40, height: 40 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Proceed button below the card */}
      <div className="seat-proceed-wrap">
        <button
          className="proceed-btn"
          id="proceedSeatBtn"
          disabled={selectedSeats.length === 0}
          onClick={onProceed}
        >
          {selectedSeats.length === 0
            ? 'Proceed to Book'
            : `Proceed to Book (${selectedSeats.join(', ')})`}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-6-7 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
