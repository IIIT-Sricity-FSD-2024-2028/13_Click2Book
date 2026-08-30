import { Module } from '@nestjs/common';
import { SupportTicketController } from './support-ticket.controller';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketRepository } from './support-ticket.repository';
import { LedgerModule } from '../ledger/ledger.module';
import { RevenueSplitModule } from '../revenue-split/revenue-split.module';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [LedgerModule, RevenueSplitModule, SupportModule],
  controllers: [SupportTicketController],
  providers: [SupportTicketService, SupportTicketRepository],
  exports: [SupportTicketService, SupportTicketRepository],
})
export class SupportTicketModule {}
