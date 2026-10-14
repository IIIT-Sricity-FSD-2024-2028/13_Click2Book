import { ConflictException, BadRequestException } from '@nestjs/common';
import { CancellationService } from './cancellation.service';
import { CancellationRepository } from './cancellation.repository';
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
import { SupportTicketRepository } from '../support-ticket/support-ticket.repository';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { SupportRepository } from '../support/support.repository';
import { RefundRepository } from '../refund/refund.repository';
import { RefundService } from '../refund/refund.service';
import { PaymentRepository } from '../payment/payment.repository';
import { PaymentService } from '../payment/payment.service';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { SeatStatus } from '../seat/enums/seat-status.enum';
import { RefundStatus } from '../refund/enums/refund-status.enum';

describe('CancellationService (Multi-seat cancellation & refunds)', () => {
  let cancellationService: CancellationService;
  let cancellationRepo: CancellationRepository;
  let bookingRepo: BookingRepository;
  let vehicleRepo: VehicleRepository;
  let seatRepo: SeatRepository;
  let refundService: RefundService;
  let refundRepo: RefundRepository;

  beforeEach(() => {
    cancellationRepo = new CancellationRepository();
    bookingRepo = new BookingRepository();
    const tripRepo = new TripRepository();
    vehicleRepo = new VehicleRepository();
    seatRepo = new SeatRepository();
    seatRepo.initSeats('V001', 45);
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

    const supportTicketService = new SupportTicketService(
      new SupportTicketRepository(),
      ledgerService,
      revenueSplitService,
      new SupportRepository(),
    );

    cancellationService = new CancellationService(
      cancellationRepo,
      bookingService,
      ledgerService,
      supportTicketService,
    );

    refundRepo = new RefundRepository();
    const paymentRepo = new PaymentRepository();
    const paymentService = new PaymentService(paymentRepo, bookingRepo, bookingService);
    refundService = new RefundService(refundRepo, cancellationRepo, paymentService);
  });

  it('cancels a single confirmed booking and releases the vehicle seat', () => {
    // Seeded B001 is on trip T001 (vehicle V001, seat 5)
    const initialRemaining = vehicleRepo.findById('V001')!.remainingSeats;

    const res = cancellationService.cancel({ bookingId: 'B001' });
    expect(res.success).toBe(true);

    const b = bookingRepo.findById('B001');
    expect(b?.bookingStatus).toBe(BookingStatus.CANCELLED);

    // Vehicle seat should be released
    const updatedRemaining = vehicleRepo.findById('V001')!.remainingSeats;
    expect(updatedRemaining).toBe(initialRemaining + 1);

    const seat = seatRepo.findSeat('V001', 5);
    expect(seat?.seatStatus).toBe(SeatStatus.AVAILABLE);
  });

  it('rejects double cancellation with ConflictException', () => {
    cancellationService.cancel({ bookingId: 'B001' });

    expect(() =>
      cancellationService.cancel({ bookingId: 'B001' }),
    ).toThrow(ConflictException);
  });

  it('handles multi-seat cancellations independently and verifies each seat release', () => {
    // T001 is on vehicle V001. Seeded B001 (seat 5) and B002 (seat 6) are on T001.
    const initialSeats = vehicleRepo.findById('V001')!.remainingSeats;

    // Cancel seat 1 of the booking group (B001)
    const res1 = cancellationService.cancel({ bookingId: 'B001' });
    expect(res1.success).toBe(true);
    expect(vehicleRepo.findById('V001')!.remainingSeats).toBe(initialSeats + 1);
    expect(seatRepo.findSeat('V001', 5)?.seatStatus).toBe(SeatStatus.AVAILABLE);

    // Cancel seat 2 of the booking group (B002)
    const res2 = cancellationService.cancel({ bookingId: 'B002' });
    expect(res2.success).toBe(true);
    expect(vehicleRepo.findById('V001')!.remainingSeats).toBe(initialSeats + 2);
    expect(seatRepo.findSeat('V001', 6)?.seatStatus).toBe(SeatStatus.AVAILABLE);

    // Verify both are marked CANCELLED in repository
    expect(bookingRepo.findById('B001')?.bookingStatus).toBe(BookingStatus.CANCELLED);
    expect(bookingRepo.findById('B002')?.bookingStatus).toBe(BookingStatus.CANCELLED);
  });

  it('allows refund requests for all seats in a multi-seat cancellation', () => {
    // Multi-seat cancellation
    cancellationService.cancel({ bookingId: 'B001' });
    cancellationService.cancel({ bookingId: 'B002' });

    // Request refund for each seat
    const ref1 = refundService.request({ bookingId: 'B001', refundAmount: 550 });
    const ref2 = refundService.request({ bookingId: 'B002', refundAmount: 550 });

    expect(ref1.success).toBe(true);
    expect(ref1.data.refundStatus).toBe(RefundStatus.REQUESTED);

    expect(ref2.success).toBe(true);
    expect(ref2.data.refundStatus).toBe(RefundStatus.REQUESTED);

    // Uncancelled seat B003 cannot request refund
    expect(() =>
      refundService.request({ bookingId: 'B003', refundAmount: 670 }),
    ).toThrow(BadRequestException);
  });
});
