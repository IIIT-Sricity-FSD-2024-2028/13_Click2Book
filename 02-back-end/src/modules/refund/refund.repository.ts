import { Injectable } from '@nestjs/common';
import { Refund } from './interfaces/refund.interface';
import { RefundStatus } from './enums/refund-status.enum';

@Injectable()
export class RefundRepository {
  private refunds: Refund[] = [];

  create(data: Omit<Refund, 'refundDate' | 'refundStatus'>): Refund {
    const refund: Refund = {
      ...data,
      refundStatus: RefundStatus.REQUESTED,
      refundDate: new Date().toISOString().split('T')[0],
    };
    this.refunds.push(refund);
    return refund;
  }

  findAll(): Refund[] { return this.refunds; }
  findByBooking(bookingId: string): Refund | undefined { return this.refunds.find(r => r.bookingId === bookingId); }
  findByStatus(status: RefundStatus): Refund[] { return this.refunds.filter(r => r.refundStatus === status); }

  update(bookingId: string, data: Partial<Refund>): Refund | undefined {
    const i = this.refunds.findIndex(r => r.bookingId === bookingId);
    if (i === -1) return undefined;
    this.refunds[i] = { ...this.refunds[i], ...data };
    return this.refunds[i];
  }
}
