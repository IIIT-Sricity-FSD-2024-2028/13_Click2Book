import { Module } from '@nestjs/common';
import { CancellationController } from './cancellation.controller';
import { CancellationService } from './cancellation.service';
import { CancellationRepository } from './cancellation.repository';
import { BookingModule } from '../booking/booking.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';

@Module({
  imports: [BookingModule, LedgerModule, SupportTicketModule],
  controllers: [CancellationController],
  providers: [CancellationService, CancellationRepository],
  exports: [CancellationService, CancellationRepository],
})
export class CancellationModule {}
