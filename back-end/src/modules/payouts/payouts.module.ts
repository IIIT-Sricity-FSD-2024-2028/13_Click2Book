import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { LedgerModule } from '../ledger/ledger.module';
import { ProviderModule } from '../provider/provider.module';
import { AdminModule } from '../admin/admin.module';
import { SupportModule } from '../support/support.module';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';

@Module({
  imports: [LedgerModule, ProviderModule, AdminModule, SupportModule, SupportTicketModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
