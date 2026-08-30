import { Module } from '@nestjs/common';
import { LostFoundController } from './lost-found.controller';
import { LostFoundService } from './lost-found.service';
import { LostFoundRepository } from './lost-found.repository';
import { BookingModule } from '../booking/booking.module';
import { TripModule } from '../trip/trip.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';

@Module({
  imports: [BookingModule, TripModule, VehicleModule, SupportTicketModule],
  controllers: [LostFoundController],
  providers: [LostFoundService, LostFoundRepository],
  exports: [LostFoundService, LostFoundRepository],
})
export class LostFoundModule {}
