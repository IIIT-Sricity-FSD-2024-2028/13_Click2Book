import { NotFoundException, BadRequestException } from '@nestjs/common';
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
import { RouteRepository } from '../route/route.repository';
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
  let offerRepo: OfferRepository;

  beforeEach(() => {
    paymentRepo = new PaymentRepository();
    bookingRepo = new BookingRepository();
    const tripRepo = new TripRepository();
    const vehicleRepo = new VehicleRepository();
    const seatRepo = new SeatRepository();
    seatRepo.initSeats('V001', 45);
    offerRepo = new OfferRepository();
    const offerService = new OfferService(offerRepo);
    const scheduleRepo = new ScheduleRepository();
    const routeRepo = new RouteRepository();
    const revenueSplitService = new RevenueSplitService(new RevenueSplitRepository());
    const ledgerService = new LedgerService(
      new LedgerRepository(),
      tripRepo,
      scheduleRepo,
      new ProviderRepository(),
      new AdminRepository(),
      revenueSplitService,
    );

    bookingService = new BookingService(
      bookingRepo,
      tripRepo,
      vehicleRepo,
      seatRepo,
      scheduleRepo,
      routeRepo,
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

  it('handles a repeated payment request for a confirmed booking idempotently', () => {
    const result = paymentService.processPayment({
        bookingId: 'B001',
        amount: 600,
        paymentMethod: 'UPI',
      });

    expect(result.success).toBe(true);
    expect(result.data?.paymentStatus).toBe(PaymentStatus.SUCCESS);
  });

  it('handles a successful payment retry idempotently if the booking status is stale', () => {
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

    const paymentCount = paymentRepo.findAll().length;
    const retry = paymentService.processPayment({
        bookingId: pendingBooking.bookingId,
        amount: 450,
        paymentMethod: 'UPI',
      });

    expect(retry.success).toBe(true);
    expect(paymentRepo.findAll()).toHaveLength(paymentCount);
    expect(bookingRepo.findById(pendingBooking.bookingId)?.bookingStatus).toBe(BookingStatus.CONFIRMED);
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
      paymentMethod: 'UPI',
    });

    expect(result.success).toBe(true);
    expect(result.data.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(result.data.discountAmount).toBe(0);

    const updatedBooking = bookingRepo.findById(pendingBooking.bookingId);
    expect(updatedBooking?.bookingStatus).toBe(BookingStatus.CONFIRMED);
  });

  it('rejects a frontend discount without a validated coupon on the booking', () => {
    const pendingBooking = bookingRepo.create({
      customerId: 'C001',
      tripId: 'T001',
      seatNumber: 21,
    });

    expect(() => paymentService.processPayment({
      bookingId: pendingBooking.bookingId,
      amount: 400,
      discountAmount: 100,
      paymentMethod: 'UPI',
    })).toThrow(BadRequestException);
  });

  it('marks payment as FAILED if booking confirmation throws an error, avoiding false revenue', () => {
    const pendingBooking = bookingRepo.create({
      customerId: 'C001',
      tripId: 'T001',
      seatNumber: 22,
    });

    // Spy on bookingService.confirm to simulate an unexpected error during confirmation
    jest.spyOn(bookingService, 'confirm').mockImplementationOnce(() => {
      throw new Error('Database write error during booking confirmation');
    });

    expect(() =>
      paymentService.processPayment({
        bookingId: pendingBooking.bookingId,
        amount: 500,
        paymentMethod: 'CARD',
      }),
    ).toThrow('Database write error during booking confirmation');

    // Verify payment record was updated to FAILED
    const payment = paymentRepo.findByBooking(pendingBooking.bookingId);
    expect(payment).toBeDefined();
    expect(payment?.paymentStatus).toBe(PaymentStatus.FAILED);

    // Verify booking was not confirmed
    const booking = bookingRepo.findById(pendingBooking.bookingId);
    expect(booking?.bookingStatus).toBe(BookingStatus.PENDING);
  });

  it('supports booking creation with FIRSTBUS100 coupon and transitions to CONFIRMED on payment', () => {
    const res = bookingService.create({
      customerId: 'C001',
      tripId: 'T001',
      seatNumber: 25,
      offerCode: 'FIRSTBUS100',
    });

    expect(res.success).toBe(true);
    const booking = res.data;
    if (!booking) throw new Error('Booking response data was missing');
    const bookingId = booking.bookingId;
    expect(booking.offerId).toBeDefined();
    expect(booking.bookingStatus).toBe(BookingStatus.PENDING);

    const payRes = paymentService.processPayment({
      bookingId,
      amount: 500,
      discountAmount: 100,
      paymentMethod: 'UPI',
    });

    expect(payRes.success).toBe(true);
    expect(payRes.data.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(payRes.data.discountAmount).toBe(100);

    const confirmed = bookingRepo.findById(bookingId);
    expect(confirmed?.bookingStatus).toBe(BookingStatus.CONFIRMED);
    expect(offerRepo.findRedemptions(booking.offerId)).toHaveLength(1);

    paymentService.processPayment({
      bookingId,
      amount: 500,
      discountAmount: 100,
      paymentMethod: 'UPI',
    });
    expect(offerRepo.findRedemptions(booking.offerId)).toHaveLength(1);
  });

  it('marks payment as REFUNDED when requested for a processed booking', () => {
    const pendingBooking = bookingRepo.create({
      customerId: 'C001',
      tripId: 'T001',
      seatNumber: 28,
    });

    paymentService.processPayment({
      bookingId: pendingBooking.bookingId,
      amount: 500,
      paymentMethod: 'UPI',
    });

    const refundRes = paymentService.markRefunded(pendingBooking.bookingId);
    expect(refundRes.success).toBe(true);
    expect(refundRes.data.paymentStatus).toBe(PaymentStatus.REFUNDED);
  });
});
