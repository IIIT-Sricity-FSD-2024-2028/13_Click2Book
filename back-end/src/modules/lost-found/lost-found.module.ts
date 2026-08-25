import { Module } from '@nestjs/common';
import { LostFoundController } from './lost-found.controller';
import { LostFoundService } from './lost-found.service';
import { LostFoundRepository } from './lost-found.repository';
import { BookingModule } from '../booking/booking.module';
import { TripModule } from '../trip/trip.module';
import { VehicleModule } from '../vehicle/vehicle.module';

@Module({
  imports: [BookingModule, TripModule, VehicleModule],
  controllers: [LostFoundController],
  providers: [LostFoundService, LostFoundRepository],
  exports: [LostFoundService, LostFoundRepository],
})
export class LostFoundModule {}
