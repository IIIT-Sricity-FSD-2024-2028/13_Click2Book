import React from 'react';
import { Check, Printer, Calendar, Search } from 'lucide-react';

export default function BookingConfirmed({ booking, onGoToBookings, onNewSearch }) {
  if (!booking) return null;

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', width: '100%' }}>
      <div className="confirm-card">
        {/* Success Green Strip */}
        <div className="success-top-strip">
          <div className="tick-ring">
            <Check size={42} strokeWidth={3} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px' }}>
            Ticket Booked Successfully!
          </h2>
          <p style={{ fontSize: '0.86rem', opacity: 0.9 }}>
            Your e-ticket has been generated. Safe travels!
          </p>
        </div>

        {/* Confirmation Body */}
        <div className="confirm-body">
          {/* Booking ID Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>BOOKING REFERENCE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                {booking.bookingId}
              </div>
            </div>
            <span className="status-badge status-confirmed">CONFIRMED ✓</span>
          </div>

          {/* Details Table */}
          <table className="confirm-details-table">
            <tbody>
              <tr>
                <td>Route</td>
                <td>{booking.from} → {booking.to}</td>
              </tr>
              <tr>
                <td>Bus Operator</td>
                <td>{booking.busName} ({booking.busType})</td>
              </tr>
              <tr>
                <td>Travel Date</td>
                <td>{booking.date}</td>
              </tr>
              <tr>
                <td>Assigned Seat(s)</td>
                <td>{booking.seats}</td>
              </tr>
              <tr>
                <td>Passengers</td>
                <td>{booking.passengerCount} traveler{booking.passengerCount > 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>{booking.paymentMethod}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>Total Amount Paid</td>
                <td style={{ fontWeight: 900, color: '#16a34a', fontSize: '1.15rem' }}>₹{booking.total}</td>
              </tr>
            </tbody>
          </table>

          {booking.discount > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a', fontSize: '0.78rem', fontWeight: 700, padding: '5px 16px', borderRadius: '50px' }}>
                🏷️ You saved ₹{booking.discount} with a promo offer!
              </span>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => window.print()}
              style={{ flex: 1 }}
            >
              <Printer size={16} /> Print Ticket
            </button>
            <button
              type="button"
              className="btn-orange"
              onClick={onGoToBookings}
              style={{ flex: 1 }}
            >
              <Calendar size={16} /> My Bookings
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              onClick={onNewSearch}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Search size={14} /> Book Another Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
