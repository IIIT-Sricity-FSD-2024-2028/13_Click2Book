import { forwardRef, Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { TripModule } from '../trip/trip.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SeatModule } from '../seat/seat.module';
import { OfferModule } from '../offer/offer.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { RouteModule } from '../route/route.module';

@Module({
  imports: [
    TripModule,
    VehicleModule,
    SeatModule,
    OfferModule,
    ScheduleModule,
    RouteModule,
    forwardRef(() => LedgerModule),
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService, BookingRepository],
})
export class BookingModule {}
