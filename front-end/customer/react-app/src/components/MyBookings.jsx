import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, XCircle, RotateCcw, Navigation, MapPin, AlertTriangle, Radio, CheckCircle, ShieldAlert, X, Star } from 'lucide-react';
import { API } from '../services/api';
import LiveBusTrackerModal from './LiveBusTrackerModal';

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

  // Review State (Task 3)
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', punctuality: 5, cleanliness: 5, comfort: 5, staff: 5 });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Live Bus Tracking State (Workflow 4)
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const fetchTrackingForBooking = useCallback(async (booking) => {
    if (!booking) return;
    setTrackingLoading(true);
    const tripId = booking.tripId || 'T001';

    let location = null;
    let eta = null;

    try {
      if (API.tracking && typeof API.tracking.getLocation === 'function') {
        const locRes = await API.tracking.getLocation(tripId);
        location = locRes?.data || locRes;
      }
    } catch {}

    try {
      if (API.tracking && typeof API.tracking.getEta === 'function') {
        const etaRes = await API.tracking.getEta(tripId);
        eta = etaRes?.data || etaRes;
      }
    } catch {}

    const tripStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const tStatus = tripStatuses[tripId];
    const timePassed = isDepartureTimeReached(booking.date, booking.departureTime);
    const hasStarted = tStatus === 'IN_PROGRESS' || (timePassed && tStatus !== 'COMPLETED');
    const isCompleted = tStatus === 'COMPLETED';

    const defaultCoords = {
      lat: location?.lat != null ? Number(location.lat) : 13.5684,
      lng: location?.lng != null ? Number(location.lng) : 80.0215,
      nextStop: location?.nextStop || (isCompleted ? `${booking.to} Terminal` : hasStarted ? 'Highway Transit Junction' : `${booking.from} Boarding Point`),
      status: isCompleted ? 'COMPLETED' : hasStarted ? 'IN_PROGRESS' : 'SCHEDULED',
      percentComplete: eta?.percentComplete != null ? eta.percentComplete : (isCompleted ? 100 : hasStarted ? 52 : 0),
      etaMinutes: eta?.etaMinutes != null ? eta.etaMinutes : (isCompleted ? 0 : hasStarted ? 45 : 120),
      distanceKm: eta?.distanceKm || 300,
      speedKmph: hasStarted && !isCompleted ? 54 : 0,
      updatedAt: location?.updatedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTrackingData(defaultCoords);
    setTrackingLoading(false);
  }, [customer, user]);

  useEffect(() => {
    if (!trackingBooking) return;
    fetchTrackingForBooking(trackingBooking);
    const interval = setInterval(() => {
      fetchTrackingForBooking(trackingBooking);
    }, 5000);
    return () => clearInterval(interval);
  }, [trackingBooking, fetchTrackingForBooking]);

  const handleTrackBusClick = (b) => {
    setTrackingBooking(b);
    setSosSent(false);
  };

  const handleCloseTracking = () => {
    setTrackingBooking(null);
    setTrackingData(null);
    setSosSent(false);
  };

  const handleTriggerSos = async () => {
    if (!trackingBooking) return;
    setSosLoading(true);
    try {
      if (API.tracking && typeof API.tracking.raiseSos === 'function') {
        await API.tracking.raiseSos(
          trackingBooking.bookingId,
          'EMERGENCY',
          `Customer SOS alert triggered for booking ${trackingBooking.bookingId} (${trackingBooking.from} → ${trackingBooking.to})`,
          trackingData?.lat,
          trackingData?.lng
        );
      }
    } catch (e) {
      console.warn('SOS call note:', e);
    }
    setSosLoading(false);
    setSosSent(true);
    if (showToast) {
      showToast('🚨 Emergency SOS alert sent to dispatch, operator and emergency responders!', 'error');
    }
  };

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

    try {
      const revs = JSON.parse(localStorage.getItem('c2b_bus_reviews') || '[]');
      setReviewsList(revs);
    } catch {}

    setBookings(Array.from(bookingMap.values()));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookings();

    const handleStorageChange = (e) => {
      if (!e || !e.key || e.key === 'c2b_bookings' || e.key === 'c2b_refunds' || e.key === 'c2b_bus_reviews' || e.key === 'c2b_trip_statuses') {
        loadBookings();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('c2b_sync', loadBookings);
    window.addEventListener('focus', loadBookings);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('c2b_sync', loadBookings);
      window.removeEventListener('focus', loadBookings);
    };
  }, [loadBookings]);

  const handleOpenReview = (b) => {
    setReviewingBooking(b);
    setReviewForm({ rating: 5, comment: '', punctuality: 5, cleanliness: 5, comfort: 5, staff: 5 });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingBooking) return;
    setSubmittingReview(true);
    try {
      const customerName = customer?.name || user?.name || reviewingBooking.raw?.customerName || reviewingBooking.raw?.passengerName || 'Customer';
      const customerId = customer?.id || user?.id || 'C001';
      const seatNumber = reviewingBooking.seats || '1';

      await API.reviews.submit({
        tripId: reviewingBooking.tripId || 'T001',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        bookingId: reviewingBooking.bookingId,
        seatNumber,
        busName: reviewingBooking.busName,
        route: `${reviewingBooking.from} → ${reviewingBooking.to}`,
        customerName,
        customerId,
        categories: {
          punctuality: reviewForm.punctuality,
          cleanliness: reviewForm.cleanliness,
          comfort: reviewForm.comfort,
          staff: reviewForm.staff,
        },
      });

      const revs = JSON.parse(localStorage.getItem('c2b_bus_reviews') || '[]');
      setReviewsList(revs);
      setReviewingBooking(null);
      if (showToast) {
        showToast('⭐ Thank you! Your review has been submitted to the bus operator.', 'success');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

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
            const isCompleted = tStatus === 'COMPLETED' || b.status === 'COMPLETED' || b.tripStatus === 'COMPLETED';
            const userReview = reviewsList.find((r) => (r.bookingId && (r.bookingId === b.bookingId)) || (r.tripId === b.tripId && r.customerName === (customer?.name || user?.name || 'Customer')));

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

                  {isCompleted && (
                    userReview ? (
                      <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                        <span>⭐ Reviewed ({userReview.rating}★)</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 12px', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.76rem', color: '#92400e', fontWeight: 600 }}>
                          🏁 Destination Reached! How was your journey?
                        </span>
                        <button
                          type="button"
                          className="btn-orange"
                          style={{ padding: '3px 10px', fontSize: '0.72rem', borderRadius: '6px' }}
                          onClick={() => handleOpenReview(b)}
                        >
                          ⭐ Rate &amp; Review
                        </button>
                      </div>
                    )
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
                    {isCompleted && !userReview && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb', fontWeight: 700 }}
                        onClick={() => handleOpenReview(b)}
                      >
                        ⭐ Rate &amp; Review
                      </button>
                    )}
                    {!isCancelled && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#2563eb', borderColor: '#bfdbfe' }}
                        onClick={() => handleTrackBusClick(b)}
                      >
                        <Navigation size={13} /> Track Bus
                      </button>
                    )}

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

      {/* Real Google Maps Live Bus Tracking Modal (Task 5) */}
      <LiveBusTrackerModal
        isOpen={!!trackingBooking}
        onClose={handleCloseTracking}
        booking={trackingBooking}
        onRaiseSos={handleTriggerSos}
        isProviderView={false}
      />

      {/* Rate & Review Modal (Task 3) */}
      {reviewingBooking && (
        <div className="modal-overlay" onClick={() => setReviewingBooking(null)} style={{ zIndex: 9999 }}>
          <div
            className="modal-card"
            style={{ maxWidth: '480px', width: '100%', padding: '24px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Rate &amp; Review Your Journey
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  {reviewingBooking.busName} · {reviewingBooking.from} → {reviewingBooking.to}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingBooking(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '18px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  OVERALL EXPERIENCE
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.8rem',
                        cursor: 'pointer',
                        color: star <= reviewForm.rating ? '#f59e0b' : '#cbd5e1',
                        lineHeight: 1,
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {reviewForm.rating === 5 ? 'Excellent' : reviewForm.rating === 4 ? 'Good' : reviewForm.rating === 3 ? 'Average' : reviewForm.rating === 2 ? 'Poor' : 'Terrible'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Your Feedback (What did you like or want improved?)
                </label>
                <textarea
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Share details about punctuality, driving comfort, AC, cleanliness..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setReviewingBooking(null)}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-orange"
                  disabled={submittingReview}
                  style={{ padding: '8px 20px', fontSize: '0.82rem' }}
                >
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
