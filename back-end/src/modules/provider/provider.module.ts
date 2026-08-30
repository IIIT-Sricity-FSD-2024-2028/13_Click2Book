import { forwardRef, Module } from '@nestjs/common';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderRepository } from './provider.repository';
import { VehicleModule } from '../vehicle/vehicle.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  // forwardRef: LedgerModule imports ProviderModule back (to resolve/validate
  // providerId at ledger creation), and TripModule (imported by LedgerModule) also
  // imports ProviderModule (to filter search results by approval) — a 3-way cycle:
  // ProviderModule -> LedgerModule -> TripModule -> ProviderModule.
  imports: [VehicleModule, ScheduleModule, forwardRef(() => LedgerModule)],
  controllers: [ProviderController],
  providers: [ProviderService, ProviderRepository],
  exports: [ProviderService, ProviderRepository],
})
export class ProviderModule {}
