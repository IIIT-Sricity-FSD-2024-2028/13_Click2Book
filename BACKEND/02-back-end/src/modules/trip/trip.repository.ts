import { Injectable } from '@nestjs/common';
import { Trip } from './interfaces/trip.interface';
import { TripStatus } from './enums/trip-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class TripRepository {
  private trips: Trip[] = [
    // Hyderabad → Chennai
    { tripId: 'T001', scheduleId: 'SCH001', vehicleId: 'V001', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T002', scheduleId: 'SCH002', vehicleId: 'V004', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T003', scheduleId: 'SCH003', vehicleId: 'V007', tripStatus: TripStatus.SCHEDULED },
    // Bangalore → Mumbai
    { tripId: 'T004', scheduleId: 'SCH004', vehicleId: 'V003', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T005', scheduleId: 'SCH005', vehicleId: 'V005', tripStatus: TripStatus.SCHEDULED },
    // Delhi → Jaipur
    { tripId: 'T006', scheduleId: 'SCH006', vehicleId: 'V012', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T007', scheduleId: 'SCH007', vehicleId: 'V006', tripStatus: TripStatus.SCHEDULED },
    // Hyderabad → Bangalore
    { tripId: 'T008', scheduleId: 'SCH008', vehicleId: 'V002', tripStatus: TripStatus.SCHEDULED },
    // Mumbai → Pune
    { tripId: 'T009', scheduleId: 'SCH009', vehicleId: 'V008', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T010', scheduleId: 'SCH010', vehicleId: 'V003', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T011', scheduleId: 'SCH011', vehicleId: 'V006', tripStatus: TripStatus.SCHEDULED },
    // Vijayawada → Tirupati
    { tripId: 'T012', scheduleId: 'SCH012', vehicleId: 'V001', tripStatus: TripStatus.SCHEDULED },
    // Bangalore → Mysore
    { tripId: 'T013', scheduleId: 'SCH013', vehicleId: 'V002', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T014', scheduleId: 'SCH014', vehicleId: 'V006', tripStatus: TripStatus.SCHEDULED },
    // Hyderabad → Vijayawada (Vande Bharat + regular)
    { tripId: 'T015', scheduleId: 'SCH015', vehicleId: 'V011', tripStatus: TripStatus.SCHEDULED },
    { tripId: 'T016', scheduleId: 'SCH016', vehicleId: 'V010', tripStatus: TripStatus.SCHEDULED },
  ];

  create(data: Omit<Trip, 'tripId'>): Trip {
    const trip: Trip = { tripId: generateId('T'), ...data };
    this.trips.push(trip);
    return trip;
  }

  findAll(): Trip[] { return this.trips; }
  findById(tripId: string): Trip | undefined { return this.trips.find(t => t.tripId === tripId); }
  findBySchedule(scheduleId: string): Trip[] { return this.trips.filter(t => t.scheduleId === scheduleId); }
  findByVehicle(vehicleId: string): Trip[] { return this.trips.filter(t => t.vehicleId === vehicleId); }
  findByStatus(status: TripStatus): Trip[] { return this.trips.filter(t => t.tripStatus === status); }

  update(tripId: string, data: Partial<Trip>): Trip | undefined {
    const i = this.trips.findIndex(t => t.tripId === tripId);
    if (i === -1) return undefined;
    this.trips[i] = { ...this.trips[i], ...data };
    return this.trips[i];
  }

  remove(tripId: string): boolean {
    const i = this.trips.findIndex(t => t.tripId === tripId);
    if (i === -1) return false;
    this.trips.splice(i, 1);
    return true;
  }
}
