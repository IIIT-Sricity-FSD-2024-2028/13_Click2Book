/** Display helpers for offers coming from the backend (GET /offers/active). */

export function offerDiscountLabel(o) {
  if (o.flatDiscount != null) return `Save ₹${o.flatDiscount}`;
  return `${o.discountPercentage}% OFF${o.maxDiscount ? ` up to ₹${o.maxDiscount}` : ''}`;
}

export function offerTitle(o) {
  return o.title || offerDiscountLabel(o);
}

const DAY_NAMES = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };
const METHOD_NAMES = { UPI: 'UPI', CARD: 'Card', NETBANKING: 'Net Banking', WALLET: 'Wallet' };
const split = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

/** The conditions a customer must meet, as short phrases (expiry is shown separately by offerExpiry). */
export function offerConditions(o) {
  const c = [];
  // User-based
  if (o.firstBookingOnly) c.push('First booking only');
  if (o.minPastBookings) c.push(`For customers with ${o.minPastBookings}+ past bookings`);
  // Time-based
  if (o.validDays) {
    const days = split(o.validDays).map((d) => DAY_NAMES[d.toUpperCase()] || d);
    c.push(days.join(',') === 'Sat,Sun' ? 'Weekend travel only' : `Travel on ${days.join(', ')}`);
  }
  if (o.minDaysAhead) c.push(`Book ${o.minDaysAhead}+ days ahead`);
  if (o.maxDaysAhead != null && o.maxDaysAhead !== '') c.push(o.maxDaysAhead === 0 ? 'Same-day travel only' : `Travel within ${o.maxDaysAhead} days`);
  // Booking-based
  if (o.minFare) c.push(`Min. booking ₹${o.minFare}`);
  if (o.minSeats) c.push(`Min. ${o.minSeats} seats`);
  if (o.originCity) c.push(`From ${o.originCity}`);
  if (o.routeId) c.push(`Route ${o.routeId} only`);
  // Bus-based
  if (o.providerId && o.providerId.toUpperCase() !== 'ALL') c.push(`Only on operator ${o.providerId}`);
  if (o.vehicleTypes) c.push(`${split(o.vehicleTypes).join(' / ')} buses`);
  // Payment-based
  if (o.paymentMethods) c.push(`Pay via ${split(o.paymentMethods).map((m) => METHOD_NAMES[m.toUpperCase()] || m).join(' or ')}`);
  // Usage limits
  if (o.flatDiscount == null && o.maxDiscount) c.push(`Max discount ₹${o.maxDiscount}`);
  if (o.maxUsesPerUser) c.push(o.maxUsesPerUser === 1 ? 'One-time use' : `Up to ${o.maxUsesPerUser} uses per customer`);
  if (o.maxTotalUses) c.push(`${Math.max(0, o.maxTotalUses - (o.usedCount || 0))} of ${o.maxTotalUses} left`);
  return c;
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Whole days until the offer's last valid day (0 = today is the last day, negative = expired). */
export function offerDaysLeft(o) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  return Math.round((new Date(o.endDate) - today) / 864e5);
}

/** e.g. "Expires 31 Dec 2026 · 12 days left" — the offer can be used up to and including that date. */
export function offerExpiry(o) {
  const left = offerDaysLeft(o);
  if (left < 0) return `Expired on ${fmtDate(o.endDate)}`;
  const when = left === 0 ? 'last day today' : left === 1 ? '1 day left' : `${left} days left`;
  return `Expires ${fmtDate(o.endDate)} · ${when}`;
}

export function offerDescription(o) {
  return o.description || `${offerDiscountLabel(o)} on your bus booking.`;
}
