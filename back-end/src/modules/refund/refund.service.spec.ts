import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundRepository } from './refund.repository';
import { CancellationRepository } from '../cancellation/cancellation.repository';
import { PaymentService } from '../payment/payment.service';
import { PaymentRepository } from '../payment/payment.repository';
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
import { RefundStatus } from './enums/refund-status.enum';
import { PaymentStatus } from '../payment/enums/payment-status.enum';

describe('RefundService', () => {
  let refundService: RefundService;
  let refundRepo: RefundRepository;
  let cancellationRepo: CancellationRepository;
  let paymentRepo: PaymentRepository;
  let paymentService: PaymentService;

  beforeEach(() => {
    refundRepo = new RefundRepository();
    cancellationRepo = new CancellationRepository();
    paymentRepo = new PaymentRepository();

    const bookingRepo = new BookingRepository();
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

    const bookingService = new BookingService(
      bookingRepo,
      tripRepo,
      vehicleRepo,
      seatRepo,
      offerService,
      ledgerService,
    );

    paymentService = new PaymentService(paymentRepo, bookingRepo, bookingService);
    refundService = new RefundService(refundRepo, cancellationRepo, paymentService);
  });

  it('rejects refund request if the booking has not been cancelled yet', () => {
    expect(() =>
      refundService.request({ bookingId: 'B001', refundAmount: 550 }),
    ).toThrow(BadRequestException);
  });

  it('rejects duplicate refund request for the same booking', () => {
    cancellationRepo.create('B001');
    refundService.request({ bookingId: 'B001', refundAmount: 550 });

    expect(() =>
      refundService.request({ bookingId: 'B001', refundAmount: 550 }),
    ).toThrow(ConflictException);
  });

  it('creates refund request in REQUESTED status when booking is cancelled', () => {
    cancellationRepo.create('B001');
    const result = refundService.request({ bookingId: 'B001', refundAmount: 550 });

    expect(result.success).toBe(true);
    expect(result.data.refundStatus).toBe(RefundStatus.REQUESTED);
    expect(result.data.refundAmount).toBe(550);
  });

  it('throws NotFoundException and does NOT complete refund when payment record is missing', () => {
    // Cancellation and refund exist for B999
    cancellationRepo.create('B999');
    refundService.request({ bookingId: 'B999', refundAmount: 550 });

    // Payment repo has NO record for B999
    expect(paymentRepo.findByBooking('B999')).toBeUndefined();

    // Processing refund must not swallow payment failure
    expect(() =>
      refundService.process('B999', { adminId: 'A001', refundStatus: RefundStatus.COMPLETED }),
    ).toThrow(NotFoundException);

    // Verify refund in repository was NOT marked as COMPLETED; remains REQUESTED
    const refund = refundRepo.findByBooking('B999');
    expect(refund?.refundStatus).toBe(RefundStatus.REQUESTED);
  });

  it('successfully processes refund to COMPLETED when payment record exists', () => {
    // Seeded B001 has payment PAY001
    cancellationRepo.create('B001');
    refundService.request({ bookingId: 'B001', refundAmount: 550 });

    const result = refundService.process('B001', { adminId: 'A001', refundStatus: RefundStatus.COMPLETED });

    expect(result.success).toBe(true);
    expect(result.data.refundStatus).toBe(RefundStatus.COMPLETED);

    // Verify payment record was marked REFUNDED
    const payment = paymentRepo.findByBooking('B001');
    expect(payment?.paymentStatus).toBe(PaymentStatus.REFUNDED);
  });

  it('processes refund rejection without requiring payment record update', () => {
    cancellationRepo.create('B999');
    refundService.request({ bookingId: 'B999', refundAmount: 550 });

    const result = refundService.process('B999', { adminId: 'A001', refundStatus: RefundStatus.REJECTED });

    expect(result.success).toBe(true);
    expect(result.data.refundStatus).toBe(RefundStatus.REJECTED);
  });
});
