import { Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { GenerateReportDto } from './dto/report.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepo: ReportRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly paymentRepo: PaymentRepository,
  ) {}

  generate(dto: GenerateReportDto) {
    const bookingsOnDate = this.bookingRepo.findAll().filter(b => b.bookingDate === dto.reportDate);
    const paymentsOnDate = this.paymentRepo.findAll().filter(p => p.paymentDate === dto.reportDate && p.paymentStatus === 'SUCCESS');
    const totalRevenue = paymentsOnDate.reduce((sum, p) => sum + (p.amount - p.discountAmount), 0);

    const report = this.reportRepo.save({
      adminId: dto.adminId,
      reportDate: dto.reportDate,
      totalBookings: bookingsOnDate.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    });

    return successResponse(`Report generated for ${dto.reportDate}`, {
      ...report,
      breakdownByStatus: {
        CONFIRMED: bookingsOnDate.filter(b => b.bookingStatus === 'CONFIRMED').length,
        CANCELLED: bookingsOnDate.filter(b => b.bookingStatus === 'CANCELLED').length,
        PENDING: bookingsOnDate.filter(b => b.bookingStatus === 'PENDING').length,
      },
    });
  }

  findAll() { return successResponse('All reports', this.reportRepo.findAll()); }
  findByAdmin(adminId: string) { return successResponse('Reports by admin', this.reportRepo.findByAdmin(adminId)); }
  findByDate(date: string) { return successResponse('Reports for date', this.reportRepo.findByDate(date)); }
}
