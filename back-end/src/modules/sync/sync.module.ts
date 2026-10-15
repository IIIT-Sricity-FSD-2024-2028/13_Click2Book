import { Global, Module, forwardRef } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { TripModule } from '../trip/trip.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { RouteModule } from '../route/route.module';
import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';
import { ProviderModule } from '../provider/provider.module';
import { RefundModule } from '../refund/refund.module';

@Global()
@Module({
  imports: [
    forwardRef(() => TripModule),
    forwardRef(() => ScheduleModule),
    forwardRef(() => VehicleModule),
    forwardRef(() => RouteModule),
    forwardRef(() => BookingModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => RefundModule),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
