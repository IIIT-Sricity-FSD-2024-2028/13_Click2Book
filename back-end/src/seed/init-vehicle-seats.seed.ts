import { INestApplicationContext } from '@nestjs/common';
import { TripRepository } from '../modules/trip/trip.repository';
import { VehicleRepository } from '../modules/vehicle/vehicle.repository';
import { SeatRepository } from '../modules/seat/seat.repository';
import { BookingRepository } from '../modules/booking/booking.repository';
import { SeatStatus } from '../modules/seat/enums/seat-status.enum';
import { BookingStatus } from '../modules/booking/enums/booking-status.enum';

// TripService.create() calls SeatRepository.initSeats() for every NEW trip, but the
// hardcoded seed trips (TripRepository's own literal array) never went through that
// path — so SeatRepository starts with zero seat records for every seeded vehicle,
// and BookingService.create() 404s ("Seat N not found") for every seat on every
// seeded trip. Run this once at bootstrap so seeded trips are actually bookable.
export function initSeededVehicleSeats(app: INestApplicationContext): void {
  const tripRepo = app.get(TripRepository);
  const vehicleRepo = app.get(VehicleRepository);
  const seatRepo = app.get(SeatRepository);
  const bookingRepo = app.get(BookingRepository);

  const seededVehicleIds = new Set(tripRepo.findAll().map((t) => t.vehicleId));
  for (const vehicleId of seededVehicleIds) {
    const vehicle = vehicleRepo.findById(vehicleId);
    if (vehicle) seatRepo.initSeats(vehicleId, vehicle.totalSeats);
  }

  // A handful of seed bookings (B001-B003) already claim specific seats on seeded
  // trips — mark those seats BOOKED so a real customer can't also book them.
  for (const booking of bookingRepo.findAll()) {
    if (booking.bookingStatus !== BookingStatus.CONFIRMED && booking.bookingStatus !== BookingStatus.PENDING) continue;
    const trip = tripRepo.findById(booking.tripId);
    if (!trip) continue;
    seatRepo.updateStatus(trip.vehicleId, booking.seatNumber, SeatStatus.BOOKED);
  }
}
