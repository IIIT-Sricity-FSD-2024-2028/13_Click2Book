import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerModule } from '../customer/customer.module';
import { ProviderModule } from '../provider/provider.module';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [CustomerModule, ProviderModule, SupportModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
