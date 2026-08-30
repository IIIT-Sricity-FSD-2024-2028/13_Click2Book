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
    if (this.cancellationRepo.findByBooking(dto.bookingId))
      throw new ConflictException(`Booking ${dto.bookingId} already cancelled`);

    // Cancel booking — this also releases the seat
    this.bookingService.cancel(dto.bookingId);

    // Flip the ledger to cancelled, then raise the wrapping support ticket that
    // draws the cancellation cost weight against the same ledger row.
    this.ledgerService.markCancelled(dto.bookingId);
    this.supportTicketService.create({
      bookingId: dto.bookingId,
      category: TicketCategory.CANCELLATION,
      sourceModule: 'manual',
    });

    // Record cancellation
    const cancellation = this.cancellationRepo.create(dto.bookingId);
    return successResponse('Booking cancelled. Refund request must be raised separately.', cancellation);
  }

  findAll() { return successResponse('All cancellations', this.cancellationRepo.findAll()); }

  findByBooking(bookingId: string) {
    const c = this.cancellationRepo.findByBooking(bookingId);
    return successResponse('Cancellation record', c || null);
  }
}
