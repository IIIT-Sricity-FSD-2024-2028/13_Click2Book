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
import { CustomerModule } from '../customer/customer.module';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [
    forwardRef(() => TripModule),
    VehicleModule,
    SeatModule,
    OfferModule,
    ScheduleModule,
    RouteModule,
    forwardRef(() => LedgerModule),
    CustomerModule,
    forwardRef(() => ProviderModule),
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    { provide: BookingRepository, useFactory: () => new BookingRepository() },
  ],
  exports: [BookingService, BookingRepository],
})
export class BookingModule {}
