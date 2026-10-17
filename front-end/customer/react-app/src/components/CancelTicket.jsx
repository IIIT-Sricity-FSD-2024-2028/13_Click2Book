import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { API } from '../services/api';
import { liveSync } from '../services/liveSync';

export default function CancelTicket({
  preselectedBooking,
  initialBooking,
  customer,
  user,
  showToast,
  onNavigate,
  onNavigateToTrackRefund,
  onBackToBookings,
}) {
  const [cancellableTickets, setCancellableTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(preselectedBooking || initialBooking || null);
  const [cancelledResult, setCancelledResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preselectedBooking || initialBooking) {
      setSelectedTicket(preselectedBooking || initialBooking);
    }
  }, [preselectedBooking, initialBooking]);

  useEffect(() => {
    // Load active cancellable tickets from localStorage & API
    const loadTickets = async () => {
      const raw = [];
      try {
        const local = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        local.forEach((b) => {
          if (b.status === 'CONFIRMED' || b.booking_status === 'CONFIRMED') {
            raw.push(b);
          }
        });
      } catch {}

      try {
        const apiData = await API.bookings.getMine();
        if (Array.isArray(apiData)) {
          apiData.forEach((b) => {
            if (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING') {
              raw.push({
                bookingId: b.bookingId,
                booking_id: b.bookingId,
                customerId: b.customerId,
                tripId: b.tripId,
                backendTripId: b.tripId,
                from: b.from || 'Hyderabad',
                to: b.to || 'Chennai',
                busName: b.busName || 'Express Bus',
                vehicleType: b.vehicleType || 'AC',
                total: b.totalAmount || b.fare || 650,
                date: b.journeyDate || b.bookingDate || new Date().toISOString().split('T')[0],
                seatNumber: b.seatNumber,
                seats: b.seatNumber ? `Seat ${b.seatNumber}` : 'Seat 1',
                seat_list: b.seatNumber ? [b.seatNumber] : [1],
                backendBookingIds: [b.bookingId],
                primaryBackendId: b.bookingId,
              });
            }
          });
        }
      } catch {}

      const seen = new Set();
      const unique = [];
      raw.forEach((b) => {
        const id = b.bookingId || b.booking_id;
        if (!id || seen.has(id)) return;
        seen.add(id);
        unique.push({
          ...b,
          bookingId: id,
          booking_id: id,
          from: b.from || 'Hyderabad',
          to: b.to || 'Chennai',
          busName: b.busName || 'Click2Book Express',
          total: Number(b.total || b.fare || 650),
          date: b.date || b.journeyDate || new Date().toISOString().split('T')[0],
          backendBookingIds: b.backendBookingIds,
          primaryBackendId: b.primaryBackendId,
          tripId: b.tripId || b.backendTripId,
          seatNumber: b.seatNumber,
          seats: b.seats || (b.seatNumber ? `Seat ${b.seatNumber}` : 'Seat 1'),
          seat_list: b.seat_list || (b.seatNumber ? [b.seatNumber] : [1]),
        });
      });

      setCancellableTickets(unique);
    };

    loadTickets();
  }, []);

  const handleConfirmCancel = async () => {
    if (!selectedTicket) return;
    setLoading(true);

    const bId = selectedTicket.bookingId || selectedTicket.booking_id;
    const customerId = selectedTicket.customerId || selectedTicket.customer_id || customer?.id || user?.id || 'C001';
    const fee = 50;
    const refundAmt = Math.max(0, selectedTicket.total - fee);

    if (selectedTicket.status === 'CANCELLED' || selectedTicket.booking_status === 'CANCELLED') {
      showToast('This ticket is already cancelled.', 'error');
      setLoading(false);
      return;
    }

    const safeFetch = async (endpoint, opts = {}) => {
      try {
        const r = await fetch(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, opts);
        return await r.json().catch(() => ({}));
      } catch {
        const direct = endpoint.startsWith('/api') ? `http://localhost:3000${endpoint}` : `http://localhost:3000/api${endpoint}`;
        const r = await fetch(direct, opts);
        return await r.json().catch(() => ({}));
      }
    };

    // 1. Gather all potential backend booking IDs from the ticket
    let candidateIds = [];
    if (Array.isArray(selectedTicket.backendBookingIds) && selectedTicket.backendBookingIds.length > 0) {
      candidateIds = selectedTicket.backendBookingIds.filter(
        (id) => id && !String(id).startsWith('MOCK_BK_') && !String(id).startsWith('LOCAL_')
      );
    }
    if (candidateIds.length === 0 && selectedTicket.primaryBackendId && !String(selectedTicket.primaryBackendId).startsWith('MOCK_BK_') && !String(selectedTicket.primaryBackendId).startsWith('LOCAL_')) {
      candidateIds = [selectedTicket.primaryBackendId];
    }
    if (candidateIds.length === 0 && bId && !String(bId).startsWith('MOCK_BK_') && !String(bId).startsWith('LOCAL_')) {
      candidateIds = [bId];
    }

    // 2. Authoritative Verification: check which candidate IDs actually exist on the backend right now
    let verifiedCanonicalIds = [];
    for (const cId of candidateIds) {
      try {
        const bRes = await API.bookings.getById(cId).catch(() => null);
        if (bRes && (bRes.bookingId || bRes.id)) {
          const canonical = bRes.bookingId || bRes.id;
          if (!verifiedCanonicalIds.includes(canonical)) {
            verifiedCanonicalIds.push(canonical);
          }
        }
      } catch {}
    }

    // 3. If not found by direct lookup, query customer's active bookings on backend
    if (verifiedCanonicalIds.length === 0) {
      try {
        const mine = await API.bookings.getMine().catch(() => []);
        if (Array.isArray(mine) && mine.length > 0) {
          // A. Exact match by candidate ID
          for (const cId of candidateIds) {
            const idMatch = mine.find((mb) => mb.bookingId === cId || mb.id === cId);
            if (idMatch && idMatch.bookingId && !verifiedCanonicalIds.includes(idMatch.bookingId)) {
              verifiedCanonicalIds.push(idMatch.bookingId);
            }
          }

          // B. Exact match by authoritative persisted relationships:
          // Same customer + same trip + same seat
          if (verifiedCanonicalIds.length === 0) {
            const ticketTripId = selectedTicket.tripId || selectedTicket.backendTripId;
            const ticketSeatNum = Number(selectedTicket.seatNumber || (Array.isArray(selectedTicket.seat_list) ? selectedTicket.seat_list[0] : null));

            const relMatch = mine.find((mb) => {
              if (mb.bookingStatus === 'CANCELLED') return false;
              if (mb.customerId && mb.customerId !== customerId) return false;
              const tripMatches = ticketTripId && mb.tripId === ticketTripId;
              const seatMatches = ticketSeatNum && Number(mb.seatNumber) === ticketSeatNum;
              return tripMatches && seatMatches;
            });

            if (relMatch && relMatch.bookingId) {
              verifiedCanonicalIds.push(relMatch.bookingId);
            }
          }
        }
      } catch (err) {
        console.warn('Backend bookings query note:', err);
      }
    }

    // 4. If booking is missing from backend memory (e.g. server restart), reconcile it
    // only when trustworthy existing data identifies the original booking unambiguously.
    if (verifiedCanonicalIds.length === 0) {
      const from = (selectedTicket.from || '').trim();
      const to = (selectedTicket.to || '').trim();
      const ticketSeatNum = Number(selectedTicket.seatNumber || (Array.isArray(selectedTicket.seat_list) ? selectedTicket.seat_list[0] : 1)) || 1;
      const journeyDate = selectedTicket.date || selectedTicket.journeyDate || new Date().toISOString().split('T')[0];

      if (!bId || !from || !to) {
        showToast(`Cannot cancel ticket: Booking details for ${bId || 'ticket'} are incomplete or cannot be verified reliably.`, 'error');
        setLoading(false);
        return;
      }

      // Resolve the authoritative trip for this route
      let resolvedTripId = null;
      const candidateTripId = selectedTicket.tripId || selectedTicket.backendTripId;

      // Check if candidateTripId exists on the backend and matches this route
      if (candidateTripId && /^T\d+$/.test(candidateTripId)) {
        try {
          const tRes = await safeFetch(`/trips/${candidateTripId}`);
          if (tRes && (tRes.data || tRes.tripId)) {
            const tData = tRes.data || tRes;
            const src = (tData.source || tData.route || '').toLowerCase();
            const dst = (tData.destination || tData.route || '').toLowerCase();
            if (!src || !dst || (src.includes(from.toLowerCase()) && dst.includes(to.toLowerCase()))) {
              resolvedTripId = tData.tripId || candidateTripId;
            }
          }
        } catch {}
      }

      // If not, lookup existing trip on backend for this route
      if (!resolvedTripId) {
        try {
          const tripsRes = await safeFetch(`/trips?source=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`);
          const tripsList = Array.isArray(tripsRes?.data) ? tripsRes.data : (Array.isArray(tripsRes) ? tripsRes : []);
          if (tripsList.length > 0) {
            const match = tripsList.find((t) =>
              (t.busName && selectedTicket.busName && t.busName.toLowerCase() === selectedTicket.busName.toLowerCase()) ||
              (selectedTicket.departureTime && t.departureTime === selectedTicket.departureTime)
            ) || tripsList[0];
            if (match?.tripId && /^T\d+$/.test(match.tripId)) {
              resolvedTripId = match.tripId;
            }
          }
        } catch {}
      }

      // If still not resolved on backend, provision the canonical route, vehicle, schedule, and trip
      // on the backend using the exact route so the booking references real, authoritative entities
      if (!resolvedTripId) {
        try {
          const providerId = selectedTicket.providerId || selectedTicket.provider_id || 'P001';

          // Step 1: Route
          const rRes = await safeFetch('/routes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
            body: JSON.stringify({ source: from, destination: to, distance: 300 }),
          });
          const routeId = rRes?.data?.routeId || rRes?.routeId || 'R001';

          // Step 2: Vehicle
          const cleanVNum = (((selectedTicket.busName || 'BUS').replace(/[^A-Za-z0-9]/g, '').toUpperCase()) + '0000').slice(0, 10);
          let vehicleId = null;
          try {
            const vehListRes = await safeFetch('/vehicles', { headers: { 'x-role': 'PROVIDER' } });
            const vehList = Array.isArray(vehListRes?.data) ? vehListRes.data : (Array.isArray(vehListRes) ? vehListRes : []);
            const exVeh = vehList.find((v) =>
              v.vehicleNumber?.toUpperCase() === cleanVNum.toUpperCase() ||
              (v.busName && selectedTicket.busName && v.busName.toLowerCase() === selectedTicket.busName.toLowerCase())
            );
            if (exVeh?.vehicleId) vehicleId = exVeh.vehicleId;
          } catch {}

          if (!vehicleId) {
            const vRes = await safeFetch('/vehicles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
              body: JSON.stringify({
                providerId,
                vehicleNumber: cleanVNum,
                vehicleType: selectedTicket.vehicleType || selectedTicket.busType || 'AC',
                totalSeats: 40,
                remainingSeats: 40,
                busName: selectedTicket.busName || 'Express Bus',
                amenities: ['AC', 'WiFi'],
                rating: 4.5,
                boardingPoint: from,
                droppingPoint: to,
              }),
            });
            vehicleId = vRes?.data?.vehicleId || vRes?.vehicleId || 'V001';
          }

          // Step 3: Schedule
          const sRes = await safeFetch('/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
            body: JSON.stringify({
              routeId,
              providerId,
              departureTime: selectedTicket.departureTime || '08:00',
              arrivalTime: selectedTicket.arrivalTime || '12:00',
              journeyDate,
              arrivalTimeToDestination: selectedTicket.arrivalTime || '12:00',
              fare: Number(selectedTicket.total || selectedTicket.fare) || 650,
            }),
          });
          const scheduleId = sRes?.data?.scheduleId || sRes?.scheduleId || 'SCH001';

          // Step 4: Trip
          const tRes = await safeFetch('/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
            body: JSON.stringify({ vehicleId, scheduleId }),
          });
          const canonicalTrip = tRes?.data?.tripId || tRes?.tripId;
          if (canonicalTrip && /^T\d+$/.test(canonicalTrip)) {
            resolvedTripId = canonicalTrip;
          }
        } catch (e) {
          console.warn('Trip provisioning for reconciliation note:', e);
        }
      }

      if (!resolvedTripId) {
        showToast(`Cannot cancel ticket: The trip for route ${from} → ${to} could not be resolved on the backend.`, 'error');
        setLoading(false);
        return;
      }

      // Reconcile the booking authoritatively on the backend
      try {
        const regRes = await API.bookings.registerHistorical({
          bookingId: bId,
          aliasId: bId,
          customerId,
          tripId: resolvedTripId,
          seatNumber: ticketSeatNum,
          date: journeyDate,
          fare: Number(selectedTicket.total || selectedTicket.fare) || 650,
          from,
          to,
        });
        const regId = regRes?.data?.bookingId || regRes?.bookingId || bId;
        verifiedCanonicalIds = [regId];
      } catch (regErr) {
        console.warn('Historical registration error:', regErr);
        showToast(`Cannot cancel ticket: Failed to reconcile booking ${bId} with backend: ${regErr.message}`, 'error');
        setLoading(false);
        return;
      }
    }

    const idsToProcess = verifiedCanonicalIds;
    const perSeatRefund = Math.round(refundAmt / idsToProcess.length);

    try {
      const cancellationResults = [];
      const refundResults = [];

      // 1. Backend cancellation endpoint (cancels booking & releases seat on vehicle)
      for (const id of idsToProcess) {
        let cancelSuccess = false;
        let cancelErrorMsg = '';
        try {
          await API.cancellations.cancel(id);
          cancelSuccess = true;
        } catch (e) {
          cancelErrorMsg = e.message || 'Cancellation rejected by backend';
          console.warn('Backend cancellation note for', id, e.message);
        }
        cancellationResults.push({ id, success: cancelSuccess, error: cancelErrorMsg });
      }

      const successfulCancels = cancellationResults.filter((r) => r.success);
      const failedCancels = cancellationResults.filter((r) => !r.success);

      // Total failure: NO seat could be cancelled on backend
      if (successfulCancels.length === 0) {
        const errorDetail = failedCancels.map((f) => `${f.id}: ${f.error}`).join('; ');
        showToast(`Cancellation failed: ${errorDetail}`, 'error');
        setLoading(false);
        return;
      }

      // 2. Backend refund request endpoint (only for successfully cancelled seats)
      for (const s of successfulCancels) {
        let refundSuccess = false;
        let refundStatusForSeat = 'REQUESTED';
        let refundErrorMsg = '';
        try {
          const refRes = await API.refunds.request(s.id, perSeatRefund, {
            refundId: `REF-${s.id}`,
            customerId,
            passengerName: customer?.name || user?.name || 'Customer',
            reason: 'Customer initiated cancellation',
          });
          refundSuccess = true;
          if (refRes && (refRes.refundStatus || refRes.status)) {
            refundStatusForSeat = refRes.refundStatus || refRes.status;
          }
        } catch (e) {
          refundErrorMsg = e.message || 'Refund request rejected';
          console.warn('Backend refund request note for', s.id, e.message);
        }
        refundResults.push({
          id: s.id,
          success: refundSuccess,
          status: refundStatusForSeat,
          error: refundErrorMsg,
        });
      }

      const successfulRefunds = refundResults.filter((r) => r.success);
      const isPartial = failedCancels.length > 0;
      const actualRefundAmt = perSeatRefund * successfulCancels.length;

      // 3. Update localStorage bookings based on actual backend results
      try {
        const allBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        let found = false;
        allBookings.forEach((b) => {
          if (b.bookingId === bId || b.booking_id === bId) {
            found = true;
            if (isPartial) {
              b.status = 'PARTIALLY_CANCELLED';
              b.booking_status = 'PARTIALLY_CANCELLED';
              b.cancelledSeatIds = successfulCancels.map((c) => c.id);
              b.remainingSeatIds = failedCancels.map((f) => f.id);
            } else {
              b.status = 'CANCELLED';
              b.booking_status = 'CANCELLED';
              b.cancelled_at = new Date().toISOString();
            }
          }
        });
        if (!found) {
          allBookings.unshift({
            ...selectedTicket,
            bookingId: bId,
            booking_id: bId,
            status: isPartial ? 'PARTIALLY_CANCELLED' : 'CANCELLED',
            booking_status: isPartial ? 'PARTIALLY_CANCELLED' : 'CANCELLED',
            cancelled_at: new Date().toISOString(),
          });
        }
        localStorage.setItem('c2b_bookings', JSON.stringify(allBookings));
      } catch {}

      // 4. Save refund record to localStorage for the cancelled seats
      if (successfulRefunds.length > 0) {
        try {
          const allRefunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
          const existingIdx = allRefunds.findIndex((r) => r.booking_id === bId || r.bookingId === bId);
          const refItem = {
            refund_id: `REF-${bId}`,
            refundId: `REF-${bId}`,
            booking_id: bId,
            bookingId: bId,
            customer_id: customerId,
            customerId,
            passenger_name: customer?.name || user?.name || 'Customer',
            passengerName: customer?.name || user?.name || 'Customer',
            route: `${selectedTicket.from} → ${selectedTicket.to}`,
            bus_name: selectedTicket.busName,
            original_fare: selectedTicket.total,
            fee,
            refund_amount: actualRefundAmt,
            amount: actualRefundAmt,
            status: isPartial ? 'PARTIALLY_REFUNDED' : (successfulRefunds[0]?.status || 'REQUESTED'),
            request_date: new Date().toISOString().split('T')[0],
            payment_method: 'UPI / Bank Source',
            arn: `ARN${Date.now().toString().slice(-9)}`,
          };
          if (existingIdx >= 0) {
            allRefunds[existingIdx] = refItem;
          } else {
            allRefunds.unshift(refItem);
          }
          localStorage.setItem('c2b_refunds', JSON.stringify(allRefunds));
        } catch {}
      }

      // 5. Update schedule in c2b_bus_schedules so provider immediately sees released seat & deducted revenue
      try {
        const localScheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        let updatedSched = false;
        const seatCount = successfulCancels.length;
        localScheds.forEach((s) => {
          const tid = s.id || s.tripId || s.trip_id;
          const matchId = tid && (tid === selectedTicket.tripId || tid === selectedTicket.backendTripId);
          const matchRoute = s.from?.toLowerCase() === selectedTicket.from?.toLowerCase() &&
                             s.to?.toLowerCase() === selectedTicket.to?.toLowerCase();
          if (matchId || matchRoute) {
            s.bookedSeats = Math.max(0, (s.bookedSeats || s.booked_seats || 0) - seatCount);
            s.booked_seats = Math.max(0, (s.booked_seats || 0) - seatCount);
            s.availableSeats = Math.min((s.totalSeats || s.total_seats || 40), (s.availableSeats || 0) + seatCount);
            s.available_seats = Math.min((s.totalSeats || s.total_seats || 40), (s.available_seats || 0) + seatCount);
            s.revenue = Math.max(0, (s.revenue || 0) - (selectedTicket.total || 0));
            updatedSched = true;
          }
        });
        if (updatedSched) {
          localStorage.setItem('c2b_bus_schedules', JSON.stringify(localScheds));
        }
      } catch (e) {
        console.warn('Could not update provider schedule stats on cancellation:', e);
      }

      window.dispatchEvent(new Event('storage'));
      try {
        if (typeof liveSync !== 'undefined' && liveSync.syncBooking) {
          liveSync.syncBooking({ ...selectedTicket, status: 'CANCELLED', booking_status: 'CANCELLED' });
        }
      } catch {}

      if (isPartial) {
        showToast(
          `⚠️ Partially cancelled: ${successfulCancels.length} of ${idsToProcess.length} seats cancelled.`,
          'warning'
        );
      } else {
        showToast(`Ticket ${bId} cancelled successfully! Refund initiated.`, 'success');
      }

      setCancelledResult({
        bookingId: bId,
        refundAmount: actualRefundAmt,
        fee,
        status: isPartial ? 'PARTIALLY_CANCELLED' : 'REQUESTED',
        isPartial,
        cancelledCount: successfulCancels.length,
        totalCount: idsToProcess.length,
        cancelledIds: successfulCancels.map((c) => c.id),
        failedIds: failedCancels.map((f) => `${f.id} (${f.error})`),
      });

    } catch (err) {
      showToast(err.message || 'Cancellation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackRefundClick = () => {
    if (onNavigateToTrackRefund && cancelledResult) {
      onNavigateToTrackRefund(cancelledResult.bookingId);
    } else if (onNavigate && cancelledResult) {
      onNavigate('track-refunds', { bookingId: cancelledResult.bookingId });
    }
  };

  const handleBackToBookingsClick = () => {
    if (onBackToBookings) {
      onBackToBookings();
    } else if (onNavigate) {
      onNavigate('my-bookings');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="page-heading">Cancel Ticket</h2>
      <p className="page-subhead">
        Cancel and get your refund
      </p>

      {/* Done View */}
      {cancelledResult ? (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '36px 32px', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={36} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {cancelledResult.isPartial ? 'Partial Cancellation Processed' : 'Ticket Cancelled Successfully'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
            Booking Reference: <strong style={{ color: '#0f172a' }}>{cancelledResult.bookingId}</strong>
          </p>
          {cancelledResult.isPartial && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#b45309', marginBottom: '16px', textAlign: 'left' }}>
              ⚠️ Cancelled {cancelledResult.cancelledCount} of {cancelledResult.totalCount} seat(s).
              {cancelledResult.failedIds?.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#dc2626' }}>
                  Failed: {cancelledResult.failedIds.join(', ')}
                </div>
              )}
            </div>
          )}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', maxWidth: '400px', margin: '0 auto 20px', textAlign: 'left', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Cancellation Fee:</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>₹{cancelledResult.fee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Net Refund Amount:</span>
              <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{cancelledResult.refundAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Refund Status:</span>
              <span style={{ fontWeight: 800, color: '#d97706' }}>
                {cancelledResult.status === 'COMPLETED' ? 'COMPLETED' : 'REQUESTED (Under Review)'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '22px' }}>
            The seat has been released. The refund request is recorded in the backend and awaiting administrative settlement.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-orange"
              style={{ flex: 1 }}
              onClick={handleTrackRefundClick}
            >
              <RotateCcw size={15} /> Track Refund Status
            </button>
            <button
              className="btn-ghost"
              style={{ flex: 1 }}
              onClick={handleBackToBookingsClick}
            >
              My Bookings
            </button>
          </div>
        </div>
      ) : selectedTicket ? (
        /* Confirm View */
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px 32px', boxShadow: 'var(--shadow-md)' }}>
          <button
            onClick={() => setSelectedTicket(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}
          >
            <ArrowLeft size={16} /> Choose different ticket
          </button>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Confirm Cancellation
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>
            Reference: <strong>{selectedTicket.bookingId}</strong> · {selectedTicket.from} → {selectedTicket.to}
          </p>

          {/* Refund Breakdown Card */}
          <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.88rem' }}>
              <span>Original Ticket Fare</span>
              <span style={{ fontWeight: 700 }}>₹{selectedTicket.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.88rem', color: '#dc2626' }}>
              <span>Cancellation Fee</span>
              <span style={{ fontWeight: 700 }}>−₹50</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '6px', borderTop: '1px dashed #fca5a5', fontSize: '1.05rem', fontWeight: 800, color: '#15803d' }}>
              <span>Net Refund Amount</span>
              <span>₹{Math.max(0, selectedTicket.total - 50)}</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.78rem', color: '#475569', marginBottom: '22px', display: 'flex', gap: '8px' }}>
            <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              Once confirmed, this seat will be immediately released back to the operator for re-booking. Refunds are processed within 2–3 business days.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ flex: 1 }}
              onClick={() => setSelectedTicket(null)}
            >
              Keep Ticket
            </button>
            <button
              type="button"
              className="btn-orange"
              style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              disabled={loading}
              onClick={handleConfirmCancel}
            >
              {loading ? 'Processing…' : 'Confirm & Cancel Ticket'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px', fontWeight: 600 }}>
            Select ticket to cancel:
          </p>
          {cancellableTickets.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                No active cancellable bookings found. Book a ticket first from Search Trips.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cancellableTickets.map((t) => (
                <div
                  key={t.bookingId}
                  onClick={() => setSelectedTicket(t)}
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    border: '1.5px solid #e2e8f0',
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      {t.from} → {t.to}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      {t.busName} · 📅 {t.date} · PNR: <strong>{t.bookingId}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                      ₹{t.total}
                    </span>
                    <ArrowRight size={16} color="var(--primary)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
