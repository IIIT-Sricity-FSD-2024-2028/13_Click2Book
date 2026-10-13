import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [BookingModule, PaymentModule],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService],
})
export class ReportModule {}
