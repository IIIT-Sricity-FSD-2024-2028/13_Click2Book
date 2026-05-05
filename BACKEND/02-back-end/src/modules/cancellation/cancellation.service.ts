import { Injectable, ConflictException } from '@nestjs/common';
import { CancellationRepository } from './cancellation.repository';
import { BookingService } from '../booking/booking.service';
import { CreateCancellationDto } from './dto/cancellation.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class CancellationService {
  constructor(
    private readonly cancellationRepo: CancellationRepository,
    private readonly bookingService: BookingService,
  ) {}

  cancel(dto: CreateCancellationDto) {
    if (this.cancellationRepo.findByBooking(dto.bookingId))
      throw new ConflictException(`Booking ${dto.bookingId} already cancelled`);

    // Cancel booking — this also releases the seat
    this.bookingService.cancel(dto.bookingId);

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
