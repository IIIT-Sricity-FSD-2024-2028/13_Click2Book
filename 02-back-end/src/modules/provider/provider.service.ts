import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProviderRepository } from './provider.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class ProviderService {
  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly scheduleRepo: ScheduleRepository,
  ) {}

  create(dto: CreateProviderDto) {
    if (this.providerRepo.findByEmail(dto.email))
      throw new ConflictException('Provider email already exists');
    return successResponse('Provider registered (awaiting admin approval)', this.providerRepo.create(dto));
  }

  findAll() { return successResponse('All providers', this.providerRepo.findAll()); }

  findById(id: string) {
    const p = this.providerRepo.findById(id);
    if (!p) throw new NotFoundException(`Provider ${id} not found`);
    return successResponse('Provider retrieved', p);
  }

  update(id: string, dto: UpdateProviderDto) {
    if (!this.providerRepo.findById(id)) throw new NotFoundException(`Provider ${id} not found`);
    return successResponse('Provider updated', this.providerRepo.update(id, dto));
  }

  approve(id: string) {
    if (!this.providerRepo.findById(id)) throw new NotFoundException(`Provider ${id} not found`);
    return successResponse('Provider approved', this.providerRepo.update(id, { approved: true }));
  }

  remove(id: string) {
    if (!this.providerRepo.findById(id)) throw new NotFoundException(`Provider ${id} not found`);
    this.providerRepo.remove(id);
    return successResponse('Provider removed');
  }

  getDashboard(providerId: string) {
    const provider = this.providerRepo.findById(providerId);
    if (!provider) throw new NotFoundException(`Provider ${providerId} not found`);
    const vehicles = this.vehicleRepo.findByProvider(providerId);
    const schedules = this.scheduleRepo.findByProvider(providerId);
    const totalSeats = vehicles.reduce((s, v) => s + v.totalSeats, 0);
    const bookedSeats = vehicles.reduce((s, v) => s + (v.totalSeats - v.remainingSeats), 0);
    return successResponse('Provider dashboard', {
      provider: provider.name,
      totalVehicles: vehicles.length,
      totalSchedules: schedules.length,
      totalSeats,
      bookedSeats,
      availableSeats: totalSeats - bookedSeats,
    });
  }
}
