import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { TripRepository } from './trip.repository';
import { ScheduleModule } from '../schedule/schedule.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SeatModule } from '../seat/seat.module';
import { RouteModule } from '../route/route.module';

@Module({
  imports: [ScheduleModule, VehicleModule, SeatModule, RouteModule],
  controllers: [TripController],
  providers: [TripService, TripRepository],
  exports: [TripService, TripRepository],
})
export class TripModule {}
