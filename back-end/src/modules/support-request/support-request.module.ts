import { Module } from '@nestjs/common';
import { SupportRequestController } from './support-request.controller';
import { SupportRequestService } from './support-request.service';
import { SupportRequestRepository } from './support-request.repository';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';

@Module({
  imports: [SupportTicketModule],
  controllers: [SupportRequestController],
  providers: [SupportRequestService, SupportRequestRepository],
  exports: [SupportRequestService, SupportRequestRepository],
})
export class SupportRequestModule {}
