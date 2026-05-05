import { BookingStatus } from '../enums/booking-status.enum';

export interface Booking {
  bookingId: string;
  customerId: string;
  tripId: string;
  offerId?: string;
  seatNumber: number;
  bookingDate: string;
  bookingStatus: BookingStatus;
  irctcId?: string;
}
