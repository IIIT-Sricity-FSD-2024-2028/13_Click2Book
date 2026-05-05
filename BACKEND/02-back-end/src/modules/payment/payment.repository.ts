import { Injectable } from '@nestjs/common';
import { Payment } from './interfaces/payment.interface';
import { PaymentStatus } from './enums/payment-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class PaymentRepository {
  private payments: Payment[] = [
    { paymentId: 'PAY001', bookingId: 'B001', amount: 600, discountAmount: 0, paymentMethod: 'UPI', paymentStatus: PaymentStatus.SUCCESS, paymentDate: '2026-05-01' },
    { paymentId: 'PAY002', bookingId: 'B002', amount: 600, discountAmount: 0, paymentMethod: 'Card', paymentStatus: PaymentStatus.SUCCESS, paymentDate: '2026-05-02' },
    { paymentId: 'PAY003', bookingId: 'B003', amount: 720, discountAmount: 180, paymentMethod: 'NetBanking', paymentStatus: PaymentStatus.SUCCESS, paymentDate: '2026-05-03' },
  ];

  create(data: Omit<Payment, 'paymentId' | 'paymentDate' | 'paymentStatus'>): Payment {
    const payment: Payment = {
      paymentId: generateId('PAY'),
      ...data,
      discountAmount: data.discountAmount ?? 0,
      paymentStatus: PaymentStatus.PENDING,
      paymentDate: new Date().toISOString().split('T')[0],
    };
    this.payments.push(payment);
    return payment;
  }

  findAll(): Payment[] { return this.payments; }
  findById(paymentId: string): Payment | undefined { return this.payments.find(p => p.paymentId === paymentId); }
  findByBooking(bookingId: string): Payment | undefined { return this.payments.find(p => p.bookingId === bookingId); }

  update(paymentId: string, data: Partial<Payment>): Payment | undefined {
    const i = this.payments.findIndex(p => p.paymentId === paymentId);
    if (i === -1) return undefined;
    this.payments[i] = { ...this.payments[i], ...data };
    return this.payments[i];
  }
}
