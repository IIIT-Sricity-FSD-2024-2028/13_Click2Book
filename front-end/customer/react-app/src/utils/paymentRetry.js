/**
 * Payment retry and per-seat status helpers for multi-seat bookings.
 * Preserves proportional distribution of amount and discount while ensuring
 * no duplicate payments are sent for already-successful bookings.
 */

/**
 * Calculates per-seat amounts and discounts ensuring exact total distribution
 * using Math.floor and remainder distribution.
 *
 * @param {number} totalAmount
 * @param {number} totalDiscount
 * @param {number} seatCount
 * @returns {Array<{ amount: number, discount: number }>}
 */
export function calculateSeatDistributions(totalAmount, totalDiscount, seatCount) {
  const count = Math.max(1, Number(seatCount) || 1);
  const total = Math.max(0, Number(totalAmount) || 0);
  const discount = Math.max(0, Number(totalDiscount) || 0);

  const basePerSeatAmount = Math.floor(total / count);
  const amountRemainder = total % count;

  const basePerSeatDiscount = Math.floor(discount / count);
  const discountRemainder = discount % count;

  const distributions = [];
  for (let i = 0; i < count; i++) {
    distributions.push({
      amount: basePerSeatAmount + (i < amountRemainder ? 1 : 0),
      discount: basePerSeatDiscount + (i < discountRemainder ? 1 : 0),
    });
  }
  return distributions;
}

/**
 * Validates that every selected seat has a valid backend booking ID.
 *
 * @param {Array<{ seatLabel?: string, bookingId?: string }>} seatBookings
 * @param {number} expectedCount
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSeatBookings(seatBookings, expectedCount) {
  if (!Array.isArray(seatBookings) || seatBookings.length === 0) {
    return { valid: false, error: 'No seat bookings found.' };
  }
  if (expectedCount !== undefined && seatBookings.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} seat bookings, but found ${seatBookings.length}.`,
    };
  }
  for (let i = 0; i < seatBookings.length; i++) {
    const sb = seatBookings[i];
    if (!sb || !sb.bookingId || typeof sb.bookingId !== 'string' || !sb.bookingId.trim()) {
      const label = sb?.seatLabel || `Seat index ${i}`;
      return {
        valid: false,
        error: `Missing valid backend booking ID for ${label}.`,
      };
    }
  }
  return { valid: true };
}

/**
 * Processes payments for seats, skipping already paid bookings.
 * Marks each seat booking as paid immediately after its individual payment call succeeds.
 * If a payment fails partway through, preserves the paid status of successful seats and throws.
 *
 * @param {Object} params
 * @param {Array<Object>} params.seatBookings - Array of seat booking objects (e.g. { bookingId, seatLabel, paid: boolean })
 * @param {number} params.totalAmount - Total payment amount
 * @param {number} params.totalDiscount - Total discount amount
 * @param {string} params.paymentMethod - e.g. 'UPI', 'CARD'
 * @param {Function} params.payFn - async (bookingId, amount, paymentMethod, discount) => Promise
 * @param {Function} [params.onSeatPaid] - optional callback (seatIndex, updatedSeatBooking, updatedSeatBookings) => void
 * @returns {Promise<{ allPaid: boolean, seatBookings: Array<Object> }>}
 */
export async function executeSeatPayments({
  seatBookings,
  totalAmount,
  totalDiscount,
  paymentMethod = 'UPI',
  payFn,
  onSeatPaid,
}) {
  if (!Array.isArray(seatBookings) || seatBookings.length === 0) {
    throw new Error('No seats provided for payment processing.');
  }

  if (typeof payFn !== 'function') {
    throw new Error('Payment function (payFn) must be provided.');
  }

  const distributions = calculateSeatDistributions(totalAmount, totalDiscount, seatBookings.length);

  for (let sIdx = 0; sIdx < seatBookings.length; sIdx++) {
    const sb = seatBookings[sIdx];

    // 1. Skip already paid booking
    if (sb.paid) {
      continue;
    }

    // 2. Validate booking ID
    if (!sb.bookingId || typeof sb.bookingId !== 'string' || !sb.bookingId.trim()) {
      throw new Error(`Cannot pay for seat ${sb.seatLabel || sIdx}: missing valid backend booking ID.`);
    }

    const { amount, discount } = distributions[sIdx];

    // 3. Call payment API
    await payFn(sb.bookingId, amount, paymentMethod, discount);

    // 4. Mark as paid IMMEDIATELY after payment call succeeds
    sb.paid = true;
    sb.paidAmount = amount;
    sb.paidDiscount = discount;
    sb.paidAt = new Date().toISOString();

    // 5. Notify callback immediately so state is updated before next iteration
    if (typeof onSeatPaid === 'function') {
      try {
        onSeatPaid(sIdx, sb, seatBookings);
      } catch (cbErr) {
        console.warn('onSeatPaid callback warning:', cbErr);
      }
    }
  }

  const allPaid = seatBookings.every((sb) => sb.paid === true);
  return { allPaid, seatBookings };
}
