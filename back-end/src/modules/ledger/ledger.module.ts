import { forwardRef, Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { LedgerRepository } from './ledger.repository';
import { TripModule } from '../trip/trip.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { RevenueSplitModule } from '../revenue-split/revenue-split.module';
import { ProviderModule } from '../provider/provider.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  // forwardRef: LedgerModule sits in two overlapping cycles —
  //  - LedgerModule -> TripModule -> ProviderModule -> LedgerModule (Provider needs
  //    LedgerRepository for the provider-revenue endpoint)
  //  - LedgerModule -> AdminModule -> BookingModule -> LedgerModule (Admin needs
  //    BookingModule; Booking needs LedgerModule to write ledger rows)
  imports: [
    forwardRef(() => TripModule),
    ScheduleModule,
    RevenueSplitModule,
    forwardRef(() => ProviderModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [LedgerController],
  providers: [LedgerService, LedgerRepository],
  exports: [LedgerService, LedgerRepository],
})
export class LedgerModule {}
