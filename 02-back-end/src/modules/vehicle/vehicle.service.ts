import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { VehicleRepository } from './vehicle.repository';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class VehicleService {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  create(dto: CreateVehicleDto) {
    const existing = this.vehicleRepo.findAll().find(v => v.vehicleNumber === dto.vehicleNumber);
    if (existing) throw new ConflictException(`Vehicle number ${dto.vehicleNumber} already exists`);
    return successResponse('Vehicle added', this.vehicleRepo.create(dto));
  }

  findAll() { return successResponse('All vehicles', this.vehicleRepo.findAll()); }

  findById(id: string) {
    const v = this.vehicleRepo.findById(id);
    if (!v) throw new NotFoundException(`Vehicle ${id} not found`);
    return successResponse('Vehicle retrieved', v);
  }

  findByProvider(providerId: string) {
    return successResponse(`Vehicles for provider ${providerId}`, this.vehicleRepo.findByProvider(providerId));
  }

  update(id: string, dto: UpdateVehicleDto) {
    if (!this.vehicleRepo.findById(id)) throw new NotFoundException(`Vehicle ${id} not found`);
    return successResponse('Vehicle updated', this.vehicleRepo.update(id, dto));
  }

  remove(id: string) {
    if (!this.vehicleRepo.findById(id)) throw new NotFoundException(`Vehicle ${id} not found`);
    this.vehicleRepo.remove(id);
    return successResponse('Vehicle removed');
  }
}
