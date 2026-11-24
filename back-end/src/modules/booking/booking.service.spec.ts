import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { BookingStatus } from './enums/booking-status.enum';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { OfferService } from '../offer/offer.service';
import { LedgerService } from '../ledger/ledger.service';

describe('BookingService.findByTrip', () => {
  it('only returns bookings for the exact trip, not trips with similar IDs', () => {
    const bookingRepo = new BookingRepository();
    bookingRepo.createWithId({
      bookingId: 'B910',
      customerId: 'C910',
      tripId: 'TRIP_10',
      seatNumber: 4,
      bookingDate: '2026-11-24',
      bookingStatus: BookingStatus.CONFIRMED,
    });
    bookingRepo.createWithId({
      bookingId: 'B911',
      customerId: 'C911',
      tripId: 'TRIP_100',
      seatNumber: 5,
      bookingDate: '2026-11-24',
      bookingStatus: BookingStatus.CONFIRMED,
    });
    bookingRepo.createWithId({
      bookingId: 'B912',
      customerId: 'C912',
      tripId: 'TRIP-10',
      seatNumber: 6,
      bookingDate: '2026-11-24',
      bookingStatus: BookingStatus.CONFIRMED,
    });
    const tripRepo = {
      findById: () => undefined,
      findAll: () => [],
    } as unknown as TripRepository;
    const service = new BookingService(
      bookingRepo,
      tripRepo,
      {} as VehicleRepository,
      {} as SeatRepository,
      {} as ScheduleRepository,
      {} as RouteRepository,
      {} as OfferService,
      {} as LedgerService,
    );

    const result = service.findByTrip('TRIP_10');

    expect(result.data.map((booking) => booking.bookingId)).toEqual(['B910']);
  });
});
