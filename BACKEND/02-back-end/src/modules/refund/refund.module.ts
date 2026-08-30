import { Module } from '@nestjs/common';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { RefundRepository } from './refund.repository';
import { CancellationModule } from '../cancellation/cancellation.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [CancellationModule, PaymentModule],
  controllers: [RefundController],
  providers: [RefundService, RefundRepository],
  exports: [RefundService, RefundRepository],
})
export class RefundModule {}
