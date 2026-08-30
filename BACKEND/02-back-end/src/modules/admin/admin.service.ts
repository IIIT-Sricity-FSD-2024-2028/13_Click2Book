import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { CreateAdminDto } from './dto/admin.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly paymentRepo: PaymentRepository,
  ) {}

  create(dto: CreateAdminDto) {
    if (this.adminRepo.findByEmail(dto.email))
      throw new ConflictException('Admin email already exists');
    return successResponse('Admin created', this.adminRepo.create(dto));
  }

  findAll() { return successResponse('All admins', this.adminRepo.findAll()); }

  findById(id: string) {
    const a = this.adminRepo.findById(id);
    if (!a) throw new NotFoundException(`Admin ${id} not found`);
    return successResponse('Admin retrieved', a);
  }

  getDashboard() {
    const allBookings = this.bookingRepo.findAll();
    const allPayments = this.paymentRepo.findAll();
    const totalRevenue = allPayments
      .filter(p => p.paymentStatus === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount - p.discountAmount, 0);

    return successResponse('Admin dashboard', {
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter(b => b.bookingStatus === 'CONFIRMED').length,
      cancelledBookings: allBookings.filter(b => b.bookingStatus === 'CANCELLED').length,
      totalRevenue: totalRevenue.toFixed(2),
      totalPayments: allPayments.length,
    });
  }
}
