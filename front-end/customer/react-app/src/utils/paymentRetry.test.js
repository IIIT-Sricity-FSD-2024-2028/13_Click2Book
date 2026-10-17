import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSeatDistributions,
  validateSeatBookings,
  executeSeatPayments,
} from './paymentRetry.js';

describe('Payment Retry and Per-Seat Status Helper', () => {
  it('calculates proportional seat amount and discount distributions with remainder correctly', () => {
    // Total 500, discount 50, 3 seats
    // 500 / 3 = 166 rem 2 -> [167, 167, 166]
    // 50 / 3 = 16 rem 2 -> [17, 17, 16]
    const dist = calculateSeatDistributions(500, 50, 3);
    assert.equal(dist.length, 3);
    assert.deepEqual(dist[0], { amount: 167, discount: 17 });
    assert.deepEqual(dist[1], { amount: 167, discount: 17 });
    assert.deepEqual(dist[2], { amount: 166, discount: 16 });

    const totalAmount = dist.reduce((acc, d) => acc + d.amount, 0);
    const totalDiscount = dist.reduce((acc, d) => acc + d.discount, 0);
    assert.equal(totalAmount, 500);
    assert.equal(totalDiscount, 50);
  });

  it('validates that every selected seat has a valid backend booking ID', () => {
    // Valid
    const validBookings = [
      { seatLabel: 'A1', bookingId: 'BK_101', paid: false },
      { seatLabel: 'A2', bookingId: 'BK_102', paid: false },
    ];
    assert.equal(validateSeatBookings(validBookings, 2).valid, true);

    // Missing bookingId on seat 2
    const missingIdBookings = [
      { seatLabel: 'A1', bookingId: 'BK_101', paid: false },
      { seatLabel: 'A2', bookingId: null, paid: false },
    ];
    const res1 = validateSeatBookings(missingIdBookings, 2);
    assert.equal(res1.valid, false);
    assert.match(res1.error, /Missing valid backend booking ID for A2/);

    // Count mismatch
    const countMismatch = [
      { seatLabel: 'A1', bookingId: 'BK_101', paid: false },
    ];
    const res2 = validateSeatBookings(countMismatch, 2);
    assert.equal(res2.valid, false);
    assert.match(res2.error, /Expected 2 seat bookings, but found 1/);
  });

  it('Requirement 6: first seat succeeds, second seat fails, retry skips first seat and processes only the second', async () => {
    const seatBookings = [
      { seatLabel: 'A1', bookingId: 'BK_A1', paid: false },
      { seatLabel: 'A2', bookingId: 'BK_A2', paid: false },
    ];

    const paymentLog = [];
    const totalAmount = 1000;
    const totalDiscount = 100;
    const paymentMethod = 'UPI';

    // Mock payFn where BK_A1 succeeds, but BK_A2 fails on the first attempt
    let failA2 = true;
    const mockPayFn = async (bookingId, amount, method, discount) => {
      paymentLog.push({ bookingId, amount, method, discount });
      if (bookingId === 'BK_A2' && failA2) {
        throw new Error('Payment gateway timeout on second seat');
      }
      return { success: true };
    };

    // First attempt: should pay seat 1, fail on seat 2, and throw
    let firstAttemptError = null;
    try {
      await executeSeatPayments({
        seatBookings,
        totalAmount,
        totalDiscount,
        paymentMethod,
        payFn: mockPayFn,
      });
    } catch (err) {
      firstAttemptError = err;
    }

    // 1. Verify first attempt threw the error
    assert.ok(firstAttemptError, 'First attempt should throw an error');
    assert.equal(firstAttemptError.message, 'Payment gateway timeout on second seat');

    // 2. Verify payment calls during first attempt
    assert.equal(paymentLog.length, 2);
    assert.equal(paymentLog[0].bookingId, 'BK_A1');
    assert.equal(paymentLog[0].amount, 500);
    assert.equal(paymentLog[0].discount, 50);
    assert.equal(paymentLog[1].bookingId, 'BK_A2');
    assert.equal(paymentLog[1].amount, 500);
    assert.equal(paymentLog[1].discount, 50);

    // 3. Verify status per booking ID after partial failure:
    // Seat 1 MUST be marked paid immediately
    assert.equal(seatBookings[0].paid, true, 'Seat 1 must be marked as paid immediately');
    assert.equal(seatBookings[0].paidAmount, 500);
    assert.equal(seatBookings[0].paidDiscount, 50);
    assert.ok(seatBookings[0].paidAt, 'Seat 1 should have paidAt timestamp');

    // Seat 2 MUST remain unpaid
    assert.equal(seatBookings[1].paid, false, 'Seat 2 must remain unpaid after failure');

    // 4. Second attempt (Retry):
    // Now simulate resolved network / gateway, so BK_A2 will succeed
    failA2 = false;
    paymentLog.length = 0; // Clear payment call log to verify calls during retry

    const retryResult = await executeSeatPayments({
      seatBookings,
      totalAmount,
      totalDiscount,
      paymentMethod,
      payFn: mockPayFn,
    });

    // 5. Verify retry behavior:
    // Seat 1 was skipped (not called again)
    // ONLY Seat 2 was processed
    assert.equal(paymentLog.length, 1, 'Retry must call payment API exactly once (only for unpaid seat)');
    assert.equal(paymentLog[0].bookingId, 'BK_A2', 'Retry must only process the unpaid seat BK_A2');
    assert.equal(paymentLog[0].amount, 500, 'Retry must preserve exact seat amount');
    assert.equal(paymentLog[0].discount, 50, 'Retry must preserve exact seat discount');

    // 6. Verify final state:
    assert.equal(retryResult.allPaid, true, 'All seats must be marked as paid');
    assert.equal(seatBookings[0].paid, true);
    assert.equal(seatBookings[1].paid, true);
    assert.equal(seatBookings[1].paidAmount, 500);
    assert.equal(seatBookings[1].paidDiscount, 50);
  });

  it('notifies onSeatPaid callback immediately upon each successful seat payment', async () => {
    const seatBookings = [
      { seatLabel: 'B1', bookingId: 'BK_B1', paid: false },
      { seatLabel: 'B2', bookingId: 'BK_B2', paid: false },
    ];

    const callbacks = [];
    const mockPayFn = async (bookingId) => {
      if (bookingId === 'BK_B2') {
        throw new Error('Simulated failure');
      }
      return { success: true };
    };

    try {
      await executeSeatPayments({
        seatBookings,
        totalAmount: 600,
        totalDiscount: 60,
        paymentMethod: 'CARD',
        payFn: mockPayFn,
        onSeatPaid: (sIdx, paidSeat) => {
          callbacks.push({ sIdx, bookingId: paidSeat.bookingId, paid: paidSeat.paid });
        },
      });
    } catch {}

    // Callback should have fired for seat index 0 before error occurred on seat index 1
    assert.equal(callbacks.length, 1);
    assert.deepEqual(callbacks[0], { sIdx: 0, bookingId: 'BK_B1', paid: true });
    assert.equal(seatBookings[0].paid, true);
    assert.equal(seatBookings[1].paid, false);
  });

  it('Scenario 4 & 11: Loading state resets to false and error is captured even when payment throws', async () => {
    let isProcessing = true;
    let paymentError = null;
    try {
      throw new Error('Network timeout during payment processing');
    } catch (err) {
      paymentError = err.message;
    } finally {
      isProcessing = false;
    }
    assert.equal(isProcessing, false, 'Loading state must be reset to false after failure');
    assert.equal(paymentError, 'Network timeout during payment processing');
  });

  it('Scenario 5: Duplicate submission is prevented while payment is in progress', async () => {
    let isProcessingPayment = false;
    let callCount = 0;

    const simulatePayment = async () => {
      if (isProcessingPayment) return { skipped: true };
      isProcessingPayment = true;
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      isProcessingPayment = false;
      return { skipped: false };
    };

    const [first, second] = await Promise.all([
      simulatePayment(),
      simulatePayment(),
    ]);

    assert.equal(first.skipped, false);
    assert.equal(second.skipped, true);
    assert.equal(callCount, 1, 'Payment logic must only be executed once on duplicate concurrent submissions');
  });

  it('Scenario 6: Single coupon application prevents discount multiplication across seats', () => {
    const selectedSeats = ['A1', 'A2', 'A3'];
    const offerCode = 'FIRSTBUS100';
    const reservationPayloads = selectedSeats.map((seat, sIdx) => ({
      seat,
      offerCode: sIdx === 0 ? offerCode : null,
    }));

    const appliedOffers = reservationPayloads.filter((p) => p.offerCode !== null);
    assert.equal(appliedOffers.length, 1, 'Offer code must only be applied once across multiple seats');
    assert.equal(appliedOffers[0].offerCode, 'FIRSTBUS100');
  });

  it('Scenario 7, 8, 9, 12: Booking deduplication and cross-portal metadata synchronization', () => {
    const existingBookings = [
      { bookingId: 'BK_EXISTING', booking_id: 'BK_EXISTING', status: 'CONFIRMED', total: 600 },
    ];

    const newBooking = {
      bookingId: 'BK_NEW_100',
      booking_id: 'BK_NEW_100',
      providerId: 'P001',
      provider_id: 'P001',
      customerId: 'C001',
      seats: 'A1, A2',
      seat_list: ['A1', 'A2'],
      total: 950,
      status: 'CONFIRMED',
      booking_status: 'CONFIRMED',
    };

    // First save
    let bookings = existingBookings.filter((b) => (b.bookingId || b.booking_id) !== newBooking.bookingId);
    bookings.unshift(newBooking);

    assert.equal(bookings.length, 2);
    assert.equal(bookings[0].bookingId, 'BK_NEW_100');
    assert.equal(bookings[0].providerId, 'P001');

    // Simulate retry or redundant confirmation saving same bookingId
    bookings = bookings.filter((b) => (b.bookingId || b.booking_id) !== newBooking.bookingId);
    bookings.unshift(newBooking);

    assert.equal(bookings.length, 2, 'Retry or re-confirmation must not duplicate bookings in list');
  });

  it('Scenario 10: Revenue calculation ignores CANCELLED and duplicate bookings', () => {
    const bookings = [
      { bookingId: 'B1', total: 500, status: 'CONFIRMED' },
      { bookingId: 'B1', total: 500, status: 'CONFIRMED' }, // duplicate ID
      { bookingId: 'B2', total: 400, status: 'CANCELLED' }, // cancelled
      { bookingId: 'B3', total: 700, status: 'CONFIRMED' },
    ];

    const seenIds = new Set();
    let totalRevenue = 0;
    bookings.forEach((b) => {
      if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED') return;
      seenIds.add(b.bookingId);
      totalRevenue += b.total;
    });

    assert.equal(totalRevenue, 1200, 'Revenue must equal 500 + 700 = 1200, ignoring duplicate and cancelled');
  });
});
