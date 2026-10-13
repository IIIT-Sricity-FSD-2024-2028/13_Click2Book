import { Global, Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { AdminActivityMiddleware } from './admin-activity.middleware';

/** Global so auth, booking and registration can read the live settings without import cycles. */
@Global()
@Module({
  controllers: [PlatformController],
  providers: [PlatformService, AdminActivityMiddleware],
  exports: [PlatformService, AdminActivityMiddleware],
})
export class PlatformModule {}
