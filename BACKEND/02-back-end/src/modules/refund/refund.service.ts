import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RefundRepository } from './refund.repository';
import { CancellationRepository } from '../cancellation/cancellation.repository';
import { PaymentService } from '../payment/payment.service';
import { CreateRefundDto, ProcessRefundDto } from './dto/refund.dto';
import { RefundStatus } from './enums/refund-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class RefundService {
  constructor(
    private readonly refundRepo: RefundRepository,
    private readonly cancellationRepo: CancellationRepository,
    private readonly paymentService: PaymentService,
  ) {}

  request(dto: CreateRefundDto) {
    // Cancellation must exist before requesting refund
    const cancellation = this.cancellationRepo.findByBooking(dto.bookingId);
    if (!cancellation)
      throw new BadRequestException(`Booking ${dto.bookingId} has not been cancelled yet`);
    if (this.refundRepo.findByBooking(dto.bookingId))
      throw new ConflictException(`Refund already requested for booking ${dto.bookingId}`);
    const refund = this.refundRepo.create({ bookingId: dto.bookingId, refundAmount: dto.refundAmount });
    return successResponse('Refund requested. Admin will process it.', refund);
  }

  findAll(status?: RefundStatus) {
    if (status) return successResponse('Refunds by status', this.refundRepo.findByStatus(status));
    return successResponse('All refunds', this.refundRepo.findAll());
  }

  findByBooking(bookingId: string) {
    const r = this.refundRepo.findByBooking(bookingId);
    if (!r) throw new NotFoundException(`No refund found for booking ${bookingId}`);
    return successResponse('Refund record', r);
  }

  process(bookingId: string, dto: ProcessRefundDto) {
    const refund = this.refundRepo.findByBooking(bookingId);
    if (!refund) throw new NotFoundException(`No refund for booking ${bookingId}`);
    if (refund.refundStatus === RefundStatus.COMPLETED)
      throw new BadRequestException('Refund already completed');

    const updated = this.refundRepo.update(bookingId, {
      adminId: dto.adminId,
      refundStatus: dto.refundStatus,
    });

    // If COMPLETED, mark payment as refunded
    if (dto.refundStatus === RefundStatus.COMPLETED) {
      this.paymentService.markRefunded(bookingId);
    }

    return successResponse(`Refund ${dto.refundStatus}`, updated);
  }
}
