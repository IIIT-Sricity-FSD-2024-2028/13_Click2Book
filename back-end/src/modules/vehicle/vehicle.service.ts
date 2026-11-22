import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { VehicleRepository } from './vehicle.repository';
import { CreateVehicleDto, UpdateVehicleDto, SaveSeatLayoutDto, AssignRouteDto, ChangeRouteDto, SaveRoundTripScheduleDto } from './dto/vehicle.dto';
import { successResponse } from '../../common/utils/response.util';
import { BusStatus } from './interfaces/vehicle.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class VehicleService {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  create(dto: CreateVehicleDto) {
    // 1. Strict Indian Vehicle Registration Plate Format Validation
    const cleanNumber = (dto.vehicleNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
    if (!plateRegex.test(cleanNumber)) {
      throw new BadRequestException(
        `Invalid bus registration number "${dto.vehicleNumber}". Must match standard Indian vehicle plate format: State (2 letters) + RTO (1-2 digits) + Series (1-3 letters) + 4 digits (e.g., AP 27 AB 1234 or TS 08 XY 9012). Arbitrary text or irregular formats are strictly not permitted.`,
      );
    }

    // 2. Total Passenger Capacity Validation (Must be > 10 and < 80)
    const seats = Number(dto.totalSeats);
    if (isNaN(seats) || seats <= 10 || seats >= 80) {
      throw new BadRequestException(
        `Total passenger capacity must be more than 10 and less than 80 seats (between 11 and 79 seats). Given: ${dto.totalSeats}`,
      );
    }

    // 3. Uniqueness Check
    const existing = this.vehicleRepo.findByRegistration(dto.vehicleNumber);
    if (existing) {
      throw new ConflictException(`Bus with registration number "${dto.vehicleNumber}" is already registered.`);
    }

    const bus = this.vehicleRepo.create({
      providerId: dto.providerId,
      vehicleNumber: dto.vehicleNumber.trim().toUpperCase(),
      vehicleType: dto.vehicleType,
      totalSeats: dto.totalSeats,
      remainingSeats: dto.totalSeats,
      busName: dto.busName || `${dto.vehicleNumber} (${dto.vehicleType})`,
      lowerBerths: dto.lowerBerths,
      upperBerths: dto.upperBerths,
      amenities: dto.amenities || [],
      photographs: dto.photographs || [],
      status: (dto.status as BusStatus) || 'Available',
      rating: dto.rating || 4.5,
      boardingPoint: dto.boardingPoint,
      droppingPoint: dto.droppingPoint,
    });

    return successResponse('Bus registered successfully', bus);
  }

  findAll() {
    return successResponse('All buses retrieved', this.vehicleRepo.findAll());
  }

  findById(id: string) {
    const v = this.vehicleRepo.findById(id);
    if (!v) throw new NotFoundException(`Bus ${id} not found`);
    return successResponse('Bus retrieved', v);
  }

  findByProvider(providerId: string) {
    const buses = this.vehicleRepo.findByProvider(providerId);
    return successResponse(`Buses for provider ${providerId}`, buses);
  }

  getFleetStats(providerId?: string) {
    const all = providerId ? this.vehicleRepo.findByProvider(providerId) : this.vehicleRepo.findAll();
    const totalBuses = all.length;
    const assignedBuses = all.filter((b) => b.status === 'Assigned' || b.assignedRoute).length;
    const availableBuses = all.filter((b) => b.status === 'Available').length;
    const maintenanceBuses = all.filter((b) => b.status === 'Maintenance').length;

    return successResponse('Fleet overview statistics', {
      totalBuses,
      assignedBuses,
      availableBuses,
      maintenanceBuses,
    });
  }

  saveSeatLayout(id: string, dto: SaveSeatLayoutDto, providerId?: string) {
    const bus = this.vehicleRepo.findById(id);
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    if (providerId && bus.providerId !== providerId) {
      throw new ForbiddenException('You do not have permission to modify this bus seat layout.');
    }

    const updated = this.vehicleRepo.saveSeatLayout(id, dto);
    return successResponse('Seat layout saved successfully', updated);
  }

  assignRoute(id: string, dto: AssignRouteDto, providerId?: string) {
    const bus = this.vehicleRepo.findById(id);
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    if (providerId && bus.providerId !== providerId) {
      throw new ForbiddenException('You do not have permission to assign routes to this bus.');
    }

    if (bus.status === 'Maintenance') {
      throw new BadRequestException(`Cannot assign route: Bus ${bus.vehicleNumber} is currently under Maintenance.`);
    }

    if (bus.status === 'Inactive') {
      throw new BadRequestException(`Cannot assign route: Bus ${bus.vehicleNumber} is Inactive.`);
    }

    const assignment = {
      assignmentId: generateId('ASGN'),
      vehicleId: id,
      routeId: `R_${dto.originCity.slice(0, 3)}_${dto.destCity.slice(0, 3)}`.toUpperCase(),
      originCity: dto.originCity,
      destCity: dto.destCity,
      corridorId: dto.corridorId,
      corridorName: dto.corridorName,
      distanceKm: dto.distanceKm || 350,
      durationEst: dto.durationEst || '6h 00m',
      intermediateStops: dto.intermediateStops || [],
      assignedAt: new Date().toISOString(),
      effectiveDate: dto.effectiveDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
    };

    const updated = this.vehicleRepo.assignRoute(id, assignment);
    return successResponse(`Bus ${bus.vehicleNumber} successfully assigned to ${dto.originCity} ↔ ${dto.destCity}`, updated);
  }

  changeRoute(id: string, dto: ChangeRouteDto, providerId?: string) {
    const bus = this.vehicleRepo.findById(id);
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    if (providerId && bus.providerId !== providerId) {
      throw new ForbiddenException('You do not have permission to reassign this bus.');
    }

    if (bus.status === 'Maintenance') {
      throw new BadRequestException(`Cannot reassign route: Bus is currently under Maintenance.`);
    }

    const assignment = {
      assignmentId: generateId('ASGN'),
      vehicleId: id,
      routeId: `R_${dto.originCity.slice(0, 3)}_${dto.destCity.slice(0, 3)}`.toUpperCase(),
      originCity: dto.originCity,
      destCity: dto.destCity,
      corridorId: dto.corridorId,
      corridorName: dto.corridorName,
      distanceKm: dto.distanceKm || 350,
      durationEst: dto.durationEst || '6h 00m',
      intermediateStops: dto.intermediateStops || [],
      assignedAt: new Date().toISOString(),
      effectiveDate: dto.effectiveDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
    };

    const updated = this.vehicleRepo.changeRoute(id, assignment);
    return successResponse(`Route assignment updated to ${dto.originCity} ↔ ${dto.destCity}`, updated);
  }

  saveRoundTripSchedules(id: string, dto: SaveRoundTripScheduleDto, providerId?: string) {
    const bus = this.vehicleRepo.findById(id);
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    if (providerId && bus.providerId !== providerId) {
      throw new ForbiddenException('You do not have permission to schedule this bus.');
    }

    if (!bus.assignedRoute) {
      throw new BadRequestException(`Please assign bus ${bus.vehicleNumber} to a route corridor before creating round-trip schedules.`);
    }

    // Auto turnaround time calculation
    const [uh, um] = (dto.upSchedule.arrivalTime || '14:00').split(':').map(Number);
    const [dh, dm] = (dto.downSchedule.departureTime || '20:00').split(':').map(Number);
    let restMinutes = (dh * 60 + dm) - (uh * 60 + um);
    if (restMinutes < 0) restMinutes += 24 * 60;

    const roundTripData = {
      vehicleId: id,
      assignmentId: bus.assignedRoute.assignmentId,
      upSchedule: {
        scheduleId: generateId('SCH_UP'),
        originCity: bus.assignedRoute.originCity,
        destCity: bus.assignedRoute.destCity,
        departureTime: dto.upSchedule.departureTime,
        arrivalTime: dto.upSchedule.arrivalTime,
        operatingDays: dto.upSchedule.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        intermediateStops: dto.upSchedule.intermediateStops || [],
        active: dto.upSchedule.active !== false,
      },
      downSchedule: {
        scheduleId: generateId('SCH_DN'),
        originCity: bus.assignedRoute.destCity,
        destCity: bus.assignedRoute.originCity,
        departureTime: dto.downSchedule.departureTime,
        arrivalTime: dto.downSchedule.arrivalTime,
        operatingDays: dto.downSchedule.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        intermediateStops: dto.downSchedule.intermediateStops || [],
        active: dto.downSchedule.active !== false,
      },
      fare: dto.fare || 650,
      validFrom: dto.validFrom || new Date().toISOString().split('T')[0],
      restMinutesBetweenJourneys: restMinutes,
    };

    const updated = this.vehicleRepo.saveRoundTripSchedules(id, roundTripData);
    return successResponse('Round-trip (UP and DOWN) schedules configured successfully', updated);
  }

  updateStatus(id: string, status: BusStatus, providerId?: string) {
    const bus = this.vehicleRepo.findById(id);
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    if (providerId && bus.providerId !== providerId) {
      throw new ForbiddenException('You do not have permission to change this bus status.');
    }

    const updated = this.vehicleRepo.updateStatus(id, status);
    return successResponse(`Bus status updated to ${status}`, updated);
  }

  update(id: string, dto: UpdateVehicleDto) {
    if (!this.vehicleRepo.findById(id)) throw new NotFoundException(`Vehicle ${id} not found`);
    return successResponse('Vehicle updated', this.vehicleRepo.update(id, dto));
  }

  remove(id: string) {
    const bus = this.vehicleRepo.findById(id);
    if (!bus) throw new NotFoundException(`Vehicle ${id} not found`);
    if (bus.status === 'Assigned' && bus.assignedRoute) {
      throw new BadRequestException('Cannot delete bus while it is actively assigned to a route. Remove route assignment first.');
    }
    this.vehicleRepo.remove(id);
    return successResponse('Vehicle removed successfully');
  }
}
