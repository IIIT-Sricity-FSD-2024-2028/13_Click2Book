import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { BookingRepository } from '../booking/booking.repository';
import { BookingService } from '../booking/booking.service';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { OfferRepository } from '../offer/offer.repository';
import { OfferService } from '../offer/offer.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { LedgerService } from '../ledger/ledger.service';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { AdminRepository } from '../admin/admin.repository';
import { RevenueSplitRepository } from '../revenue-split/revenue-split.repository';
import { RevenueSplitService } from '../revenue-split/revenue-split.service';
import { PaymentStatus } from './enums/payment-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let paymentRepo: PaymentRepository;
  let bookingRepo: BookingRepository;
  let bookingService: BookingService;

  beforeEach(() => {
    paymentRepo = new PaymentRepository();
    bookingRepo = new BookingRepository();
    const tripRepo = new TripRepository();
    const vehicleRepo = new VehicleRepository();
    const seatRepo = new SeatRepository();
    const offerService = new OfferService(new OfferRepository());
    const revenueSplitService = new RevenueSplitService(new RevenueSplitRepository());
    const ledgerService = new LedgerService(
      new LedgerRepository(),
      tripRepo,
      new ScheduleRepository(),
      new ProviderRepository(),
      new AdminRepository(),
      revenueSplitService,
    );

    bookingService = new BookingService(
      bookingRepo,
      tripRepo,
      vehicleRepo,
      seatRepo,
      offerService,
      ledgerService,
    );

    paymentService = new PaymentService(paymentRepo, bookingRepo, bookingService);
  });

  it('fails with NotFoundException when paying for a non-existent booking', () => {
    expect(() =>
      paymentService.processPayment({
        bookingId: 'NON_EXISTENT_BOOKING',
        amount: 500,
        paymentMethod: 'UPI',
      }),
    ).toThrow(NotFoundException);
  });

  it('fails with BadRequestException when paying for a booking that is not PENDING', () => {
    // Seeded B001 is already CONFIRMED
    expect(() =>
      paymentService.processPayment({
        bookingId: 'B001',
        amount: 600,
        paymentMethod: 'UPI',
      }),
    ).toThrow(BadRequestException);
  });

  it('fails with ConflictException if a payment already exists for the booking', () => {
    // Create a pending booking first
    const pendingBooking = bookingRepo.create({
      customerId: 'C001',
      tripId: 'T001',
      seatNumber: 15,
    });

    // Successfully pay once
    paymentService.processPayment({
      bookingId: pendingBooking.bookingId,
      amount: 450,
      paymentMethod: 'UPI',
    });

    // Manually reset booking status back to PENDING to test duplicate payment check
    bookingRepo.update(pendingBooking.bookingId, { bookingStatus: BookingStatus.PENDING });

    // Paying again must be rejected due to existing payment
    expect(() =>
      paymentService.processPayment({
        bookingId: pendingBooking.bookingId,
        amount: 450,
        paymentMethod: 'UPI',
      }),
    ).toThrow(ConflictException);
  });

  it('successfully processes payment for PENDING booking, sets paymentStatus to SUCCESS, and confirms booking', () => {
    const pendingBooking = bookingRepo.create({
      customerId: 'C001',
      tripId: 'T001',
      seatNumber: 20,
    });

    const result = paymentService.processPayment({
      bookingId: pendingBooking.bookingId,
      amount: 450,
      discountAmount: 50,
      paymentMethod: 'UPI',
    });

    expect(result.success).toBe(true);
    expect(result.data.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(result.data.discountAmount).toBe(50);

    const updatedBooking = bookingRepo.findById(pendingBooking.bookingId);
    expect(updatedBooking?.bookingStatus).toBe(BookingStatus.CONFIRMED);
  });
});
