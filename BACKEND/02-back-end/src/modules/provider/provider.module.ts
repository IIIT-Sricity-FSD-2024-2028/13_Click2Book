import { Module } from '@nestjs/common';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderRepository } from './provider.repository';
import { VehicleModule } from '../vehicle/vehicle.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [VehicleModule, ScheduleModule],
  controllers: [ProviderController],
  providers: [ProviderService, ProviderRepository],
  exports: [ProviderService, ProviderRepository],
})
export class ProviderModule {}
