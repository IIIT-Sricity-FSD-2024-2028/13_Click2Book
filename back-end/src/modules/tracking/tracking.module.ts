import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingRepository } from './tracking.repository';
import { TripModule } from '../trip/trip.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { BookingModule } from '../booking/booking.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { RouteModule } from '../route/route.module';

@Module({
  imports: [TripModule, VehicleModule, BookingModule, ScheduleModule, RouteModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingRepository],
  exports: [TrackingService, TrackingRepository],
})
export class TrackingModule {}
