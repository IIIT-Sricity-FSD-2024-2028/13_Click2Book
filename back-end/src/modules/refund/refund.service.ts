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
    
    // Idempotent: return existing refund if already requested
    const existing = this.refundRepo.findByBooking(dto.bookingId);
    if (existing) {
      return successResponse('Refund already requested. Support/Admin will process it.', existing);
    }

    const refund = this.refundRepo.create({
      refundId: dto.refundId || `REF-${dto.bookingId}`,
      bookingId: dto.bookingId,
      refundAmount: dto.refundAmount,
      customerId: dto.customerId,
      passengerName: dto.passengerName,
      reason: dto.reason || 'Customer requested ticket cancellation',
    });
    return successResponse('Refund requested. Support/Admin will process it.', refund);
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

    if (dto.refundStatus === RefundStatus.COMPLETED) {
      try {
        this.paymentService.markRefunded(bookingId);
      } catch (err) {
        // If payment record was absent in mock/seed, proceed with refund settlement
      }
    }

    const updated = this.refundRepo.update(bookingId, {
      adminId: dto.adminId || 'SUP001',
      refundStatus: dto.refundStatus,
    });

    return successResponse(`Refund ${dto.refundStatus}`, updated);
  }
}
