import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { BookingService } from '../booking/booking.service';
import { BookingRepository } from '../booking/booking.repository';
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly bookingService: BookingService,
  ) {}

  processPayment(dto: CreatePaymentDto) {
    // 1. Check booking exists
    const booking = this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundException(`Booking ${dto.bookingId} not found`);

    // 2. Booking must be PENDING
    if (booking.bookingStatus !== BookingStatus.PENDING)
      throw new BadRequestException('Payment can only be made for PENDING bookings');

    // 3. One payment per booking
    if (this.paymentRepo.findByBooking(dto.bookingId))
      throw new ConflictException(`Payment already exists for booking ${dto.bookingId}`);

    // 4. Create payment record
    const payment = this.paymentRepo.create({ ...dto, discountAmount: dto.discountAmount ?? 0 });

    // 5. Simulate payment success (in real system: call payment gateway)
    const updated = this.paymentRepo.update(payment.paymentId, { paymentStatus: PaymentStatus.SUCCESS });

    // 6. Confirm the booking after payment success
    this.bookingService.confirm(dto.bookingId);

    return successResponse('Payment successful. Booking confirmed.', updated);
  }

  findAll() { return successResponse('All payments', this.paymentRepo.findAll()); }

  findById(id: string) {
    const p = this.paymentRepo.findById(id);
    if (!p) throw new NotFoundException(`Payment ${id} not found`);
    return successResponse('Payment retrieved', p);
  }

  findByBooking(bookingId: string) {
    const p = this.paymentRepo.findByBooking(bookingId);
    if (!p) throw new NotFoundException(`No payment found for booking ${bookingId}`);
    return successResponse('Payment for booking', p);
  }

  markRefunded(bookingId: string) {
    const p = this.paymentRepo.findByBooking(bookingId);
    if (!p) throw new NotFoundException(`No payment for booking ${bookingId}`);
    const updated = this.paymentRepo.update(p.paymentId, { paymentStatus: PaymentStatus.REFUNDED });
    return successResponse('Payment marked as refunded', updated);
  }
}
