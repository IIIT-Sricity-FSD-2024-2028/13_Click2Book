import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, XCircle, RotateCcw } from 'lucide-react';
import { API } from '../services/api';

function isDepartureTimeReached(journeyDate, departureTime) {
  try {
    if (!departureTime || departureTime === '—') return false;
    const cleanTime = String(departureTime).split('→')[0].trim();
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return false;
    let hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;

    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    let d = now.getDate();

    if (journeyDate) {
      const dateStr = String(journeyDate).split('T')[0];
      const dateParts = dateStr.split('-').map(Number);
      if (dateParts.length >= 3) {
        y = dateParts[0];
        m = dateParts[1] - 1;
        d = dateParts[2];
      }
    }

    const depDate = new Date(y, m, d, hh, mm, 0, 0);
    if (isNaN(depDate.getTime())) return false;
    return now >= depDate;
  } catch {
    return false;
  }
}

export default function MyBookings({
  customer,
  user,
  showToast,
  onNavigate,
  onNavigateToCancel,
  onNavigateToTrackRefund,
  onNavigateToSearch,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'confirmed' | 'completed' | 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleCancelClick = (b) => {
    if (onNavigateToCancel) onNavigateToCancel(b);
    else if (onNavigate) onNavigate('cancel-ticket', { booking: b });
  };

  const handleTrackRefundClick = (bId) => {
    if (onNavigateToTrackRefund) onNavigateToTrackRefund(bId);
    else if (onNavigate) onNavigate('track-refunds', { bookingId: bId });
  };

  const handleSearchClick = () => {
    if (onNavigateToSearch) onNavigateToSearch();
    else if (onNavigate) onNavigate('search-trips');
  };

  const handleDownloadTicket = (b) => {
    try {
      const ticketContent = [
        '====================================================',
        '              CLICK2BOOK E-TICKET                   ',
        '====================================================',
        `PNR / Booking ID : ${b.bookingId}`,
        `Route            : ${b.from} → ${b.to}`,
        `Travel Date      : ${b.date}`,
        `Bus Operator     : ${b.busName} (${b.busType})`,
        `Seat(s)          : ${b.seats}`,
        `Fare Paid        : ₹${b.total}`,
        `Status           : ${b.status}`,
        '----------------------------------------------------',
        'Thank you for booking with Click2Book!',
        'Helpdesk: support@click2book.com | 1800-CLICK2BK',
        '====================================================',
      ].join('\n');

      const blob = new Blob([ticketContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Click2Book_Ticket_${b.bookingId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) {
        showToast('Ticket downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to download ticket:', err);
      if (showToast) {
        showToast('Failed to download ticket. Please try again.', 'error');
      }
    }
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);

    // 1. Fetch live backend bookings
    let apiData = [];
    try {
      const res = await API.bookings.getMine();
      if (Array.isArray(res)) {
        apiData = res;
      }
    } catch (e) {
      console.warn('API getMine bookings note:', e);
    }

    // 2. Fetch local storage bookings and refunds
    let localData = [];
    let refundData = [];
    try {
      const local = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      if (Array.isArray(local)) localData = local;
      const refunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
      if (Array.isArray(refunds)) refundData = refunds;
    } catch (e) {
      console.warn('localStorage reading note:', e);
    }

    // 3. Unify and merge bookings by bookingId without duplicates
    const bookingMap = new Map();

    // Populate local storage bookings first (rich display metadata)
    localData.forEach((b) => {
      const id = b.bookingId || b.booking_id;
      if (!id) return;
      const status = String(b.status || b.booking_status || 'CONFIRMED').toUpperCase();
      const refundRecord = refundData.find((r) => (r.booking_id || r.bookingId) === id);
      const confirmedRefund = refundRecord?.refund_amount ?? b.refundAmount ?? b.refund_amount ?? null;
      const totalFare = Number(b.total ?? b.amount ?? b.fare ?? 650);

      bookingMap.set(id, {
        bookingId: id,
        tripId: b.tripId || b.trip_id || 'T001',
        from: b.from || 'Hyderabad',
        to: b.to || 'Chennai',
        busName: b.busName || 'Click2Book Partner',
        busType: b.busType || 'AC Sleeper',
        date: b.date || b.journeyDate || b.bookingDate || new Date().toISOString().split('T')[0],
        departureTime: b.departureTime || '',
        arrivalTime: b.arrivalTime || '',
        seats: b.seats || (Array.isArray(b.seat_list) ? b.seat_list.join(', ') : (b.seatNumber ? `Seat ${b.seatNumber}` : 'Seat 1')),
        total: totalFare,
        refundAmount: confirmedRefund,
        status,
        backendBookingIds: b.backendBookingIds,
        raw: b,
      });
    });

    // Merge backend API bookings
    apiData.forEach((b) => {
      const id = b.bookingId || b.id;
      if (!id) return;
      const apiStatus = String(b.bookingStatus || b.status || 'CONFIRMED').toUpperCase();
      const refundRecord = refundData.find((r) => (r.booking_id || r.bookingId) === id);

      // Check if this backend booking ID matches an existing booking or alias
      let existingKey = bookingMap.has(id) ? id : null;
      if (!existingKey) {
        for (const [key, val] of bookingMap.entries()) {
          const ids = val.backendBookingIds || val.raw?.backendBookingIds;
          if (Array.isArray(ids) && ids.includes(id)) {
            existingKey = key;
            break;
          }
          if (val.primaryBackendId === id || val.raw?.primaryBackendId === id) {
            existingKey = key;
            break;
          }
          // Exact persisted relationship match (trip + seat)
          if (val.tripId === b.tripId && (val.raw?.seatNumber === b.seatNumber || (Array.isArray(val.raw?.seat_list) && val.raw.seat_list.includes(b.seatNumber)))) {
            existingKey = key;
            break;
          }
        }
      }

      if (existingKey) {
        const existing = bookingMap.get(existingKey);
        if (apiStatus === 'CANCELLED' || existing.status === 'CANCELLED') {
          existing.status = 'CANCELLED';
        } else {
          existing.status = apiStatus;
        }
        if (existing.refundAmount == null && (refundRecord?.refund_amount != null || b.refundAmount != null || b.refund_amount != null)) {
          existing.refundAmount = refundRecord?.refund_amount ?? b.refundAmount ?? b.refund_amount;
        }
        if (!existing.backendBookingIds || existing.backendBookingIds.length === 0) {
          existing.backendBookingIds = [id];
        }
      } else {
        const totalFare = Number(b.totalAmount ?? b.fare ?? 650);
        const confirmedRefund = refundRecord?.refund_amount ?? b.refundAmount ?? b.refund_amount ?? null;
        bookingMap.set(id, {
          bookingId: id,
          tripId: b.tripId || 'T001',
          from: b.from || 'Hyderabad',
          to: b.to || 'Chennai',
          busName: b.busName || 'Express Bus',
          busType: b.vehicleType || b.busType || 'AC Sleeper',
          date: b.journeyDate || b.bookingDate || new Date().toISOString().split('T')[0],
          departureTime: b.departureTime || '',
          arrivalTime: b.arrivalTime || '',
          seats: b.seatNumber ? `Seat ${b.seatNumber}` : 'Seat 1',
          total: totalFare,
          refundAmount: confirmedRefund,
          status: apiStatus,
          backendBookingIds: [id],
          primaryBackendId: id,
          _fromApi: true,
          raw: b,
        });
      }
    });

    setBookings(Array.from(bookingMap.values()));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookings();

    const handleStorageChange = (e) => {
      if (e.key === 'c2b_bookings' || e.key === 'c2b_refunds' || !e.key) {
        loadBookings();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', loadBookings);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadBookings);
    };
  }, [loadBookings]);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h2 className="page-heading">My Bookings</h2>
          <p className="page-subhead" style={{ marginBottom: 0 }}>
            Track and manage your tickets
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ borderBottom: 'none', marginBottom: '20px' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Loading your booking history…
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎫</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>No bookings found</h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '20px' }}>
            {filter === 'all'
              ? 'You have not made any bus bookings yet.'
              : `No ${filter} bookings match this filter.`}
          </p>
          <button className="btn-orange" onClick={handleSearchClick}>
            Book a Bus Ticket
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredBookings.map((b) => {
            const isCancelled = b.status === 'CANCELLED';
            const isCancellable = b.status === 'CONFIRMED' || b.status === 'PENDING';

            // Check live trip status from c2b_trip_statuses or departure time passed
            const tripStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
            const tStatus = tripStatuses[b.tripId];
            const timePassed = isDepartureTimeReached(b.date, b.departureTime);
            const hasStarted = tStatus === 'IN_PROGRESS' || (timePassed && tStatus !== 'COMPLETED');
            const isCompleted = tStatus === 'COMPLETED';

            return (
              <div
                key={b.bookingId}
                className={`booking-card ${isCancelled ? 'is-cancelled' : ''}`}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {b.from} → {b.to}
                    </span>
                    <span className={`status-badge ${getStatusBadgeClass(b.status)}`}>
                      {b.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0' }}>
                    📅 {b.date} {b.departureTime ? `(${b.departureTime})` : ''} &nbsp;·&nbsp; {b.busName} ({b.busType}) &nbsp;·&nbsp; Seat(s): <strong>{b.seats}</strong>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                    PNR / REF: {b.bookingId}
                  </div>

                  {isCancelled ? (
                    <div className="cancelled-info-pill">
                      <span className="cip-dot" />
                      <span>Ticket Cancelled · Refund Initiated</span>
                    </div>
                  ) : isCompleted ? (
                    <div className="trip-live-pill" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                      <span>🏁 Destination Reached · Trip Completed</span>
                    </div>
                  ) : hasStarted ? (
                    <div className="trip-live-pill in-progress" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800 }}>
                      <span>🟢 Bus Has Started · In Progress / En Route</span>
                    </div>
                  ) : (
                    <div className="trip-live-pill" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      <span>🕒 Journey Scheduled {b.departureTime ? `· Departs at ${b.departureTime}` : ''}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  {isCancelled ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{b.total}
                      </span>
                      {b.refundAmount != null ? (
                        <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: '2px' }}>
                          Refund: ₹{b.refundAmount}
                        </span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', marginTop: '2px' }}>
                          Refund: Processing
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                      ₹{b.total}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {!isCancelled && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                        onClick={() => handleDownloadTicket(b)}
                      >
                        <Download size={13} /> Ticket
                      </button>
                    )}

                    {isCancellable && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={() => handleCancelClick(b)}
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        type="button"
                        className="btn-track-refund"
                        onClick={() => handleTrackRefundClick(b.bookingId)}
                      >
                        <RotateCcw size={13} /> Track Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
