import { Module } from '@nestjs/common';
import { RevenueSplitController } from './revenue-split.controller';
import { RevenueSplitService } from './revenue-split.service';
import { RevenueSplitRepository } from './revenue-split.repository';

@Module({
  controllers: [RevenueSplitController],
  providers: [RevenueSplitService, RevenueSplitRepository],
  exports: [RevenueSplitService, RevenueSplitRepository],
})
export class RevenueSplitModule {}
