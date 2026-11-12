import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { RouteRepository } from './route.repository';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LocationModule],
  controllers: [RouteController],
  providers: [RouteService, RouteRepository],
  exports: [RouteService, RouteRepository],
})
export class RouteModule {}
