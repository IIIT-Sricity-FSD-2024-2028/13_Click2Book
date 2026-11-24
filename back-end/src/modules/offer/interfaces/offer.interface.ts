import { OfferStatus } from '../enums/offer-status.enum';

/**
 * A discount offer and the conditions a booking must meet to use it.
 * Every condition is optional; an unset condition does not restrict the offer.
 */
export interface Offer {
  offerId: string;
  offerCode: string; // the customer must enter (or pick) this code
  title?: string;
  description?: string;

  // Discount
  discountPercentage?: number;
  flatDiscount?: number; // takes priority over discountPercentage when both are set
  maxDiscount?: number; // ₹ cap for percentage offers, e.g. 10% up to ₹100

  // Time-based
  startDate: string;
  endDate: string; // usable up to and including this date
  validDays?: string; // travel weekdays, e.g. 'SAT,SUN' (weekend offer)
  minDaysAhead?: number; // early-bird: book at least N days before travel
  maxDaysAhead?: number; // last-minute: travel within N days of booking

  // User-based
  firstBookingOnly?: boolean; // new users: no earlier confirmed booking
  minPastBookings?: number; // loyalty: at least N earlier confirmed/completed bookings

  // Booking-based
  minFare?: number; // ₹ the booking total must reach
  minSeats?: number;
  routeId?: string;
  originCity?: string; // e.g. 'Hyderabad' — matches the route's source city

  // Bus-based
  providerId: string; // 'ALL' = every provider
  vehicleTypes?: string; // e.g. 'AC,AC Sleeper,Volvo AC'

  // Payment-based
  paymentMethods?: string; // e.g. 'UPI,CARD'

  // Usage limits
  maxTotalUses?: number; // redemptions across all customers
  maxUsesPerUser?: number; // 1 = one-time use per customer

  status: OfferStatus;
}

/** One successful use of an offer (recorded when the booking is paid, released if it is cancelled). */
export interface OfferRedemption {
  offerId: string;
  customerId: string;
  bookingId: string;
  redeemedAt: string;
}
