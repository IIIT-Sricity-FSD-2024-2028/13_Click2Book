import { forwardRef, Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { TripRepository } from './trip.repository';
import { ScheduleModule } from '../schedule/schedule.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SeatModule } from '../seat/seat.module';
import { RouteModule } from '../route/route.module';
import { ProviderModule } from '../provider/provider.module';

@Module({
  // forwardRef: ProviderModule also imports TripModule (for the provider revenue endpoint).
  imports: [ScheduleModule, VehicleModule, SeatModule, RouteModule, forwardRef(() => ProviderModule)],
  controllers: [TripController],
  providers: [TripService, TripRepository],
  exports: [TripService, TripRepository],
})
export class TripModule {}
