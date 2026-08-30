import { forwardRef, Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { TripModule } from '../trip/trip.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SeatModule } from '../seat/seat.module';
import { OfferModule } from '../offer/offer.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  // forwardRef: LedgerModule -> AdminModule -> BookingModule -> LedgerModule is a
  // real cycle (AdminModule needs BookingModule; LedgerModule needs AdminRepository
  // for adminId attribution). Previously invisible because nothing eagerly walked
  // into it early enough to matter — AuthModule importing ProviderModule (which
  // chains into LedgerModule/AdminModule) now does, right at app bootstrap.
  imports: [TripModule, VehicleModule, SeatModule, OfferModule, forwardRef(() => LedgerModule)],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService, BookingRepository],
})
export class BookingModule {}
