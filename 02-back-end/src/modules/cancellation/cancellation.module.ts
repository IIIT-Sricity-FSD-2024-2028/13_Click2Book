import { Module } from '@nestjs/common';
import { CancellationController } from './cancellation.controller';
import { CancellationService } from './cancellation.service';
import { CancellationRepository } from './cancellation.repository';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [BookingModule],
  controllers: [CancellationController],
  providers: [CancellationService, CancellationRepository],
  exports: [CancellationService, CancellationRepository],
})
export class CancellationModule {}
