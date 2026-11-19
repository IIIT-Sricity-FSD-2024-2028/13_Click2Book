import { BookingStatus } from '../enums/booking-status.enum';

export interface Booking {
  bookingId: string;
  customerId: string;
  tripId: string;
  offerId?: string;
  offerCode?: string;
  couponDiscountAmount?: number;
  couponGrossAmount?: number;
  seatNumber: number;
  bookingDate: string;
  bookingStatus: BookingStatus;
}
