/**
 * Every price rule in one place.
 *
 * - The fare per seat comes from the operator's schedule (backend `schedule.fare`,
 *   or the fare a provider entered for a locally added schedule). Nothing else
 *   invents a fare.
 * - Checkout total = seats × fare + GST on the fares + convenience fee − discount.
 *   GST % and the convenience fee come from the Super Admin's platform settings.
 * - Refund = (total − convenience fee) × refund % − cancellation fee. The
 *   convenience fee is never refunded (the ledger keeps it as platform revenue).
 *
 * A booking stores the full breakdown (`_price`) at checkout, so later pages
 * show exactly what was charged even if fares or settings change afterwards.
 */
import { getPlatformSettings } from './platformSettings';

export const formatINR = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

/** Price breakdown for `seats` seats at `farePerSeat`. */
export function fareBreakdown(farePerSeat, seats = 1, discount = 0, s = getPlatformSettings()) {
  const fare = Math.max(0, Number(farePerSeat) || 0);
  const count = Math.max(1, Number(seats) || 1);
  const subtotal = fare * count;
  const gst = Math.round((subtotal * s.fees.gstPercent) / 100);
  const convenienceFee = s.fees.convenienceFee;
  const disc = Math.min(Math.max(0, Number(discount) || 0), subtotal + gst + convenienceFee);
  return { farePerSeat: fare, seats: count, subtotal, gst, convenienceFee, discount: disc, total: subtotal + gst + convenienceFee - disc };
}

/**
 * The stored price of a booking. Bookings made before `_price` existed only
 * have a total; treat it all as refundable ticket value.
 */
export function bookingPrice(b) {
  if (b?._price && typeof b._price.total === 'number') return b._price;
  const total = Number(b?._paid ?? b?._total ?? b?.total ?? b?.amount) || 0;
  return {
    farePerSeat: Number(b?._fare ?? b?.fare) || 0,
    seats: Number(b?._passengerCount) || 1,
    subtotal: total,
    gst: 0,
    convenienceFee: 0,
    discount: 0,
    total,
  };
}

/** Refund for a cancelled booking (or a bare total) under the current rules. */
export function refundBreakdown(bookingOrTotal, s = getPlatformSettings()) {
  const price = typeof bookingOrTotal === 'number' ? { total: bookingOrTotal, convenienceFee: 0 } : bookingPrice(bookingOrTotal);
  const refundable = Math.max(0, price.total - (price.convenienceFee || 0));
  const gross = Math.round((refundable * s.cancellation.refundPercent) / 100);
  const fee = Math.min(gross, s.cancellation.cancellationFee);
  return {
    paid: price.total,
    nonRefundableFee: price.convenienceFee || 0,
    refundPercent: s.cancellation.refundPercent,
    cancellationFee: fee,
    refund: gross - fee,
  };
}

export const refundFor = (bookingOrTotal, s) => refundBreakdown(bookingOrTotal, s).refund;

/** Split `amount` into `n` whole-rupee shares that add back up exactly. */
export function splitAmount(amount, n) {
  const base = Math.floor(amount / n);
  return Array.from({ length: n }, (_, i) => base + (i < amount - base * n ? 1 : 0));
}

/**
 * DEMO buses only (shown when no operator runs a route): fare from route
 * distance at an assumed per-km rate for the bus type, rounded to ₹10.
 * These rates are placeholders, not published operator tariffs.
 */
const DEMO_RATE_PER_KM = { 'Non-AC': 1.2, AC: 1.6, 'Volvo AC': 2.0, 'AC Sleeper': 2.3 };
export function demoFare(distanceKm, busType) {
  const km = Number(distanceKm) > 0 ? Number(distanceKm) : 300;
  return Math.max(150, Math.round((km * (DEMO_RATE_PER_KM[busType] || 1.6)) / 10) * 10);
}
