import { Module } from '@nestjs/common';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { EmergencyRepository } from './emergency.repository';
import { BookingModule } from '../booking/booking.module';
import { TripModule } from '../trip/trip.module';

@Module({
  imports: [BookingModule, TripModule],
  controllers: [EmergencyController],
  providers: [EmergencyService, EmergencyRepository],
  exports: [EmergencyService, EmergencyRepository],
})
export class EmergencyModule {}
