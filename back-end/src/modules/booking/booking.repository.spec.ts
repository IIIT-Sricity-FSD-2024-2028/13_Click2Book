import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BookingRepository } from './booking.repository';
import { BookingStatus } from './enums/booking-status.enum';

describe('BookingRepository persistence', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'click2book-bookings-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('restores bookings and aliases after repository recreation', () => {
    const storagePath = join(directory, 'bookings.json');
    const repository = new BookingRepository(storagePath);
    const booking = {
      bookingId: 'B900',
      customerId: 'C900',
      tripId: 'TRIP_900',
      seatNumber: 12,
      bookingDate: '2026-11-24',
      bookingStatus: BookingStatus.CONFIRMED,
    };

    repository.createWithId(booking);
    repository.registerAlias('OLD_B900', booking.bookingId);

    const restartedRepository = new BookingRepository(storagePath);
    expect(restartedRepository.findById('B900')).toEqual(booking);
    expect(restartedRepository.findById('OLD_B900')).toEqual(booking);
  });

  it('persists status changes so cancelled seats are not restored as booked', () => {
    const storagePath = join(directory, 'bookings.json');
    const repository = new BookingRepository(storagePath);
    repository.createWithId({
      bookingId: 'B901',
      customerId: 'C901',
      tripId: 'TRIP_901',
      seatNumber: 13,
      bookingDate: '2026-11-24',
      bookingStatus: BookingStatus.CONFIRMED,
    });

    repository.update('B901', { bookingStatus: BookingStatus.CANCELLED });

    const restartedRepository = new BookingRepository(storagePath);
    expect(restartedRepository.findById('B901')?.bookingStatus).toBe(BookingStatus.CANCELLED);
  });
});
