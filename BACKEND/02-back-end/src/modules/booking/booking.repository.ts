import { Injectable } from '@nestjs/common';
import { Booking } from './interfaces/booking.interface';
import { BookingStatus } from './enums/booking-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class BookingRepository {
  private bookings: Booking[] = [
    { bookingId: 'B001', customerId: 'C001', tripId: 'T001', seatNumber: 5, bookingDate: '2026-05-01', bookingStatus: BookingStatus.CONFIRMED },
    { bookingId: 'B002', customerId: 'C002', tripId: 'T001', seatNumber: 6, bookingDate: '2026-05-02', bookingStatus: BookingStatus.CONFIRMED },
    { bookingId: 'B003', customerId: 'C003', tripId: 'T002', seatNumber: 3, offerId: 'O001', bookingDate: '2026-05-03', bookingStatus: BookingStatus.CONFIRMED },
  ];

  create(data: Omit<Booking, 'bookingId' | 'bookingDate' | 'bookingStatus'>): Booking {
    const booking: Booking = {
      bookingId: generateId('B'),
      ...data,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingStatus: BookingStatus.PENDING,
    };
    this.bookings.push(booking);
    return booking;
  }

  findAll(): Booking[] { return this.bookings; }
  findById(bookingId: string): Booking | undefined { return this.bookings.find(b => b.bookingId === bookingId); }
  findByCustomer(customerId: string): Booking[] { return this.bookings.filter(b => b.customerId === customerId); }
  findByTrip(tripId: string): Booking[] { return this.bookings.filter(b => b.tripId === tripId); }
  findByStatus(status: BookingStatus): Booking[] { return this.bookings.filter(b => b.bookingStatus === status); }

  // Check if seat already booked for a trip
  isSeatTaken(tripId: string, seatNumber: number): boolean {
    return this.bookings.some(
      b => b.tripId === tripId && b.seatNumber === seatNumber &&
        [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.bookingStatus)
    );
  }

  update(bookingId: string, data: Partial<Booking>): Booking | undefined {
    const i = this.bookings.findIndex(b => b.bookingId === bookingId);
    if (i === -1) return undefined;
    this.bookings[i] = { ...this.bookings[i], ...data };
    return this.bookings[i];
  }
}
