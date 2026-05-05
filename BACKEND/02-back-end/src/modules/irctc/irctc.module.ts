import { Module } from '@nestjs/common';
import { IrctcController } from './irctc.controller';
import { IrctcService } from './irctc.service';
import { IrctcRepository } from './irctc.repository';

@Module({
  controllers: [IrctcController],
  providers: [IrctcService, IrctcRepository],
  exports: [IrctcService, IrctcRepository],
})
export class IrctcModule {}
