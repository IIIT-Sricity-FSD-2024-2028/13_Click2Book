import { Booking } from './interfaces/booking.interface';
import { BookingStatus } from './enums/booking-status.enum';
export declare class BookingRepository {
    private bookings;
    create(data: Omit<Booking, 'bookingId' | 'bookingDate' | 'bookingStatus'>): Booking;
    findAll(): Booking[];
    findById(bookingId: string): Booking | undefined;
    findByCustomer(customerId: string): Booking[];
    findByTrip(tripId: string): Booking[];
    findByStatus(status: BookingStatus): Booking[];
    isSeatTaken(tripId: string, seatNumber: number): boolean;
    update(bookingId: string, data: Partial<Booking>): Booking | undefined;
}
