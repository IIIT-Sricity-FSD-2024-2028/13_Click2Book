import { Module } from '@nestjs/common';
import { SupportRequestController } from './support-request.controller';
import { SupportRequestService } from './support-request.service';
import { SupportRequestRepository } from './support-request.repository';

@Module({
  controllers: [SupportRequestController],
  providers: [SupportRequestService, SupportRequestRepository],
  exports: [SupportRequestService, SupportRequestRepository],
})
export class SupportRequestModule {}
