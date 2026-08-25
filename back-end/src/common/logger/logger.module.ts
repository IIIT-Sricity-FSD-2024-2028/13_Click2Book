import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * LoggerModule — Click2Book global logging infrastructure.
 *
 * Decorated @Global() so it only needs to be imported once (in AppModule).
 * After that, LoggerService is available everywhere via NestJS DI without
 * repeating the import in every feature module.
 *
 * Usage in any service/controller:
 *   constructor(private readonly logger: LoggerService) {}
 *   this.logger.log('Something happened', 'MyService');
 *   this.logger.error('Failed', err.stack, 'MyService');
 *   this.logger.adminLog('GENERATE_REPORT', 'ADMIN001', { date: '2026-05-04' });
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
