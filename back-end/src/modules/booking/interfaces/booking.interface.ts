import { BookingStatus } from '../enums/booking-status.enum';

export interface Booking {
  bookingId: string;
  customerId: string;
  providerId?: string;
  tripId: string;
  offerId?: string;
  offerCode?: string;
  couponDiscountAmount?: number;
  couponGrossAmount?: number;
  fareAmount?: number;
  seatNumber: number;
  bookingDate: string;
  bookingStatus: BookingStatus;
  from?: string;
  to?: string;
  passengerName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  age?: string | number;
  passengers?: Array<{
    seat?: string;
    seatNumber?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    gender?: string;
    age?: string | number;
  }>;
  vehicleId?: string;
  vehicleNumber?: string;
  plateNumber?: string;
  busName?: string;
  busType?: string;
  seats?: string;
  seat_list?: string[];
  rawSeatLabel?: string;
  fare?: number;
  total?: number;
  subtotal?: number;
  date?: string;
  journeyDate?: string;
  departureTime?: string;
  arrivalTime?: string;
}
