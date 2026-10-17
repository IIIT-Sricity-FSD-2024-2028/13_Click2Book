import { Injectable, ConflictException } from '@nestjs/common';
import { CancellationRepository } from './cancellation.repository';
import { BookingService } from '../booking/booking.service';
import { LedgerService } from '../ledger/ledger.service';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { TicketCategory } from '../support-ticket/enums/ticket-category.enum';
import { CreateCancellationDto } from './dto/cancellation.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class CancellationService {
  constructor(
    private readonly cancellationRepo: CancellationRepository,
    private readonly bookingService: BookingService,
    private readonly ledgerService: LedgerService,
    private readonly supportTicketService: SupportTicketService,
  ) {}

  cancel(dto: CreateCancellationDto) {
    const existing = this.cancellationRepo.findByBooking(dto.bookingId);
    if (existing) {
      return successResponse('Booking already cancelled', existing);
    }

    // Cancel booking — this also releases the seat
    const cancelRes = this.bookingService.cancel(dto.bookingId);
    const canonicalBookingId = cancelRes?.data?.bookingId || dto.bookingId;

    // Flip the ledger to cancelled, then raise the wrapping support ticket
    try {
      this.ledgerService.markCancelled(canonicalBookingId);
    } catch (e) {
      // ledger row may not exist for seed or mock bookings
    }

    try {
      this.supportTicketService.create({
        bookingId: canonicalBookingId,
        category: TicketCategory.CANCELLATION,
        sourceModule: 'manual',
      });
    } catch (e) {
      // support ticket creation failure should not abort booking cancellation
    }

    // Record cancellation under canonical ID and requested ID if different
    const cancellation = this.cancellationRepo.create(canonicalBookingId);
    if (canonicalBookingId !== dto.bookingId) {
      try {
        this.cancellationRepo.create(dto.bookingId);
      } catch {}
    }
    return successResponse('Booking cancelled. Refund request must be raised separately.', cancellation);
  }

  findAll() { return successResponse('All cancellations', this.cancellationRepo.findAll()); }

  findByBooking(bookingId: string) {
    const c = this.cancellationRepo.findByBooking(bookingId);
    return successResponse('Cancellation record', c || null);
  }
}
