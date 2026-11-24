import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RouteRepository } from './route.repository';
import { CreateRouteDto } from './dto/route.dto';
import { successResponse } from '../../common/utils/response.util';
import { LocationRepository } from '../location/location.repository';

@Injectable()
export class RouteService {
  constructor(
    private readonly routeRepo: RouteRepository,
    private readonly locationRepo: LocationRepository,
  ) {}

  create(dto: CreateRouteDto) {
    // Requirement 12: Only approved locations can be used when creating bus routes
    if (!this.locationRepo.isApproved(dto.source)) {
      throw new BadRequestException(
        `Source "${dto.source}" is not an approved location in the network. Only approved locations can be used to create routes.`,
      );
    }
    if (!this.locationRepo.isApproved(dto.destination)) {
      throw new BadRequestException(
        `Destination "${dto.destination}" is not an approved location in the network. Only approved locations can be used to create routes.`,
      );
    }

    const existing = this.routeRepo.findBySourceAndDestination(
      dto.source,
      dto.destination,
    );
    if (existing && existing.length > 0) {
      return successResponse('Route already exists', existing[0]);
    }
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
    const routes = this.routeRepo.findBySourceAndDestination(
      source,
      destination,
    );
    return successResponse(`Routes from ${source} to ${destination}`, routes);
  }

  update(id: string, dto: Partial<CreateRouteDto>) {
    const route = this.routeRepo.findById(id);
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    return successResponse('Route updated', this.routeRepo.update(id, dto));
  }

  remove(id: string) {
    if (!this.routeRepo.findById(id))
      throw new NotFoundException(`Route ${id} not found`);
    this.routeRepo.remove(id);
    return successResponse('Route deleted');
  }
}
