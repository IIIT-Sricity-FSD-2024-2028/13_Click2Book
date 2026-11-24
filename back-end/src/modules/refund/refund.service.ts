import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RefundRepository } from './refund.repository';
import { CancellationRepository } from '../cancellation/cancellation.repository';
import { PaymentService } from '../payment/payment.service';
import { CreateRefundDto, ProcessRefundDto } from './dto/refund.dto';
import { RefundStatus } from './enums/refund-status.enum';
import { successResponse } from '../../common/utils/response.util';
import { PlatformService } from '../platform/platform.service';
import { PaymentRepository } from '../payment/payment.repository';

@Injectable()
export class RefundService {
  constructor(
    private readonly refundRepo: RefundRepository,
    private readonly cancellationRepo: CancellationRepository,
    private readonly paymentService: PaymentService,
    private readonly platformService: PlatformService,
    private readonly paymentRepo: PaymentRepository,
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
      refundAmount: this.allowedRefund(dto.bookingId, dto.refundAmount),
      customerId: dto.customerId,
      passengerName: dto.passengerName,
      reason: dto.reason || 'Customer requested ticket cancellation',
    });
    return successResponse('Refund requested. Support/Admin will process it.', refund);
  }

  // Super Admin refund rules: never refund more than refundPercent of what was paid for this booking.
  // The customer app also takes off the platform fee and cancellation fee, so it asks for less.
  private allowedRefund(bookingId: string, requested: number): number {
    const payment = this.paymentRepo.findByBooking(bookingId);
    if (!payment) return requested;
    const paid = (Number(payment.amount) || 0) - (Number(payment.discountAmount) || 0);
    const { refundPercent } = this.platformService.get().cancellation;
    return Math.max(0, Math.min(requested, Math.round((paid * refundPercent) / 100)));
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
