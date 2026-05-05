import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [BookingModule, PaymentModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}
