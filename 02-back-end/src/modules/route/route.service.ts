import { Injectable, NotFoundException } from '@nestjs/common';
import { RouteRepository } from './route.repository';
import { CreateRouteDto } from './dto/route.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class RouteService {
  constructor(private readonly routeRepo: RouteRepository) {}

  create(dto: CreateRouteDto) {
    const route = this.routeRepo.create(dto);
    return successResponse('Route created successfully', route);
  }

  findAll() {
    return successResponse('All routes retrieved', this.routeRepo.findAll());
  }

  findById(id: string) {
    const route = this.routeRepo.findById(id);
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    return successResponse('Route retrieved', route);
  }

  search(source: string, destination: string) {
    const routes = this.routeRepo.findBySourceAndDestination(source, destination);
    return successResponse(`Routes from ${source} to ${destination}`, routes);
  }

  update(id: string, dto: Partial<CreateRouteDto>) {
    const route = this.routeRepo.findById(id);
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    return successResponse('Route updated', this.routeRepo.update(id, dto));
  }

  remove(id: string) {
    if (!this.routeRepo.findById(id)) throw new NotFoundException(`Route ${id} not found`);
    this.routeRepo.remove(id);
    return successResponse('Route deleted');
  }
}
