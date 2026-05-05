import { Module } from '@nestjs/common';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';
import { SeatRepository } from './seat.repository';

@Module({
  controllers: [SeatController],
  providers: [SeatService, SeatRepository],
  exports: [SeatService, SeatRepository],
})
export class SeatModule {}
