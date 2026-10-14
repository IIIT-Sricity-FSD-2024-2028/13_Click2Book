import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { API } from '../services/api';

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
                from: b.from || 'Hyderabad',
                to: b.to || 'Chennai',
                busName: b.busName || 'Express Bus',
                total: b.totalAmount || b.fare || 650,
                date: b.bookingDate || new Date().toISOString().split('T')[0],
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
          bookingId: id,
          from: b.from || 'Hyderabad',
          to: b.to || 'Chennai',
          busName: b.busName || 'Click2Book Express',
          total: Number(b.total || b.fare || 650),
          date: b.date || b.journeyDate || new Date().toISOString().split('T')[0],
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
    const fee = 50;
    const refundAmt = Math.max(0, selectedTicket.total - fee);

    const idsToProcess = (selectedTicket.backendBookingIds && selectedTicket.backendBookingIds.length > 0)
      ? selectedTicket.backendBookingIds
      : [bId];
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
        return;
      }

      // 2. Backend refund request endpoint (only for successfully cancelled seats)
      for (const s of successfulCancels) {
        let refundSuccess = false;
        let refundStatusForSeat = 'REQUESTED';
        let refundErrorMsg = '';
        try {
          const refRes = await API.refunds.request(s.id, perSeatRefund);
          refundSuccess = true;
          if (refRes && refRes.refundStatus) {
            refundStatusForSeat = refRes.refundStatus;
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
        allBookings.forEach((b) => {
          if (b.bookingId === bId || b.booking_id === bId) {
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
        localStorage.setItem('c2b_bookings', JSON.stringify(allBookings));
      } catch {}

      // 4. Save refund record to localStorage for the cancelled seats
      if (successfulRefunds.length > 0) {
        try {
          const allRefunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
          const existingIdx = allRefunds.findIndex((r) => r.booking_id === bId || r.bookingId === bId);
          const refItem = {
            refund_id: `REF-${bId}`,
            booking_id: bId,
            bookingId: bId,
            customer_id: customer?.id || user?.id || 'C001',
            route: `${selectedTicket.from} → ${selectedTicket.to}`,
            bus_name: selectedTicket.busName,
            original_fare: selectedTicket.total,
            fee,
            refund_amount: actualRefundAmt,
            status: isPartial ? 'PARTIALLY_REFUNDED' : 'PROCESSING',
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

      if (isPartial) {
        showToast(
          `⚠️ Partially cancelled: ${successfulCancels.length} of ${idsToProcess.length} seats cancelled.`,
          'warning'
        );
      } else {
        showToast(`Booking ${bId} cancelled. Refund request submitted for processing.`, 'success');
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
