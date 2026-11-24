import { Injectable } from '@nestjs/common';
import { Vehicle, BusSeatLayoutConfig, SeatLayoutItem, RouteAssignment, RoundTripSchedule, BusStatus } from './interfaces/vehicle.interface';
import { generateId } from '../../common/utils/id.util';
import { VehicleType } from './enums/vehicle-type.enum';

export function buildDefaultLayout(isSleeper: boolean, totalSeats: number): BusSeatLayoutConfig {
  const half = Math.ceil(totalSeats / 2);
  const upperHalf = totalSeats - half;
  const lowerDeck: SeatLayoutItem[] = [];
  const upperDeck: SeatLayoutItem[] = [];

  if (isSleeper) {
    const lowerRows = Math.ceil(half / 3);
    for (let r = 0; r < lowerRows; r++) {
      const n1 = r * 3 + 1;
      const n2 = r * 3 + 2;
      const n3 = r * 3 + 3;
      if (n1 <= half) {
        lowerDeck.push({ seatId: `L${n1}`, seatNumber: `L${n1}`, seatType: 'DOUBLE_SLEEPER', deck: 'LOWER', row: r + 1, col: 1, isActive: true, berthType: 'LOWER' });
      }
      if (n2 <= half) {
        lowerDeck.push({ seatId: `L${n2}`, seatNumber: `L${n2}`, seatType: 'DOUBLE_SLEEPER', deck: 'LOWER', row: r + 1, col: 2, isActive: true, berthType: 'LOWER' });
      }
      if (n3 <= half) {
        lowerDeck.push({ seatId: `L${n3}`, seatNumber: `L${n3}`, seatType: 'SINGLE_SLEEPER', deck: 'LOWER', row: r + 1, col: 4, isActive: true, berthType: 'LOWER' });
      }
    }

    const upperRows = Math.ceil(upperHalf / 3);
    for (let r = 0; r < upperRows; r++) {
      const n1 = r * 3 + 1;
      const n2 = r * 3 + 2;
      const n3 = r * 3 + 3;
      if (n1 <= upperHalf) {
        upperDeck.push({ seatId: `U${n1}`, seatNumber: `U${n1}`, seatType: 'DOUBLE_SLEEPER', deck: 'UPPER', row: r + 1, col: 1, isActive: true, berthType: 'UPPER' });
      }
      if (n2 <= upperHalf) {
        upperDeck.push({ seatId: `U${n2}`, seatNumber: `U${n2}`, seatType: 'DOUBLE_SLEEPER', deck: 'UPPER', row: r + 1, col: 2, isActive: true, berthType: 'UPPER' });
      }
      if (n3 <= upperHalf) {
        upperDeck.push({ seatId: `U${n3}`, seatNumber: `U${n3}`, seatType: 'SINGLE_SLEEPER', deck: 'UPPER', row: r + 1, col: 4, isActive: true, berthType: 'UPPER' });
      }
    }

    return {
      rows: Math.max(lowerRows, upperRows),
      cols: 4,
      totalSeats,
      lowerBerthsCount: half,
      upperBerthsCount: upperHalf,
      hasUpperDeck: true,
      lowerDeck,
      upperDeck,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const rows = Math.ceil(totalSeats / 4);
    for (let r = 0; r < rows; r++) {
      const letter = String.fromCharCode(65 + (r % 26));
      for (let c = 1; c <= 4; c++) {
        const seatIdx = r * 4 + c;
        if (seatIdx <= totalSeats) {
          lowerDeck.push({
            seatId: `${letter}${c}`,
            seatNumber: `${letter}${c}`,
            seatType: 'SEATER',
            deck: 'LOWER',
            row: r + 1,
            col: c <= 2 ? c : c + 1,
            isActive: true,
          });
        }
      }
    }

    return {
      rows,
      cols: 5,
      totalSeats,
      lowerBerthsCount: totalSeats,
      upperBerthsCount: 0,
      hasUpperDeck: false,
      lowerDeck,
      upperDeck: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

@Injectable()
export class VehicleRepository {
  private vehicles: Vehicle[] = [];

  create(data: Omit<Vehicle, 'vehicleId' | 'remainingSeats'> & { remainingSeats?: number }): Vehicle {
    const vehicle: Vehicle = {
      vehicleId: generateId('V'),
      ...data,
      remainingSeats: data.remainingSeats !== undefined ? data.remainingSeats : data.totalSeats,
      status: data.status || 'Available',
      routeHistory: [],
      createdAt: new Date().toISOString(),
    };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  private ensureLayout(v: Vehicle): Vehicle {
    if (!v.seatLayout) {
      const isSl =
        v.vehicleType === VehicleType.SLEEPER ||
        v.vehicleType === VehicleType.VOLVO ||
        (v.busName || '').toLowerCase().includes('sleeper');
      v.seatLayout = buildDefaultLayout(isSl, v.totalSeats || 40);
    }
    return v;
  }

  findAll(): Vehicle[] {
    return this.vehicles.map((v) => this.ensureLayout(v));
  }

  findById(vehicleId: string): Vehicle | undefined {
    const v = this.vehicles.find((v) => v.vehicleId === vehicleId);
    return v ? this.ensureLayout(v) : undefined;
  }

  findByProvider(providerId: string): Vehicle[] {
    return this.vehicles.filter((v) => v.providerId === providerId).map((v) => this.ensureLayout(v));
  }

  findByRegistration(vehicleNumber: string): Vehicle | undefined {
    const v = this.vehicles.find(
      (v) => v.vehicleNumber.trim().toLowerCase() === vehicleNumber.trim().toLowerCase()
    );
    return v ? this.ensureLayout(v) : undefined;
  }

  saveSeatLayout(vehicleId: string, layout: BusSeatLayoutConfig): Vehicle | undefined {
    const v = this.findById(vehicleId);
    if (!v) return undefined;
    v.seatLayout = {
      ...layout,
      updatedAt: new Date().toISOString(),
    };
    return v;
  }

  assignRoute(vehicleId: string, routeData: RouteAssignment): Vehicle | undefined {
    const v = this.findById(vehicleId);
    if (!v) return undefined;
    if (v.assignedRoute) {
      v.routeHistory = [...(v.routeHistory || []), { ...v.assignedRoute, status: 'SUPERSEDED' }];
    }
    v.assignedRoute = {
      ...routeData,
      status: 'ACTIVE',
      assignedAt: new Date().toISOString(),
    };
    v.status = 'Assigned';
    return v;
  }

  changeRoute(vehicleId: string, newRouteData: RouteAssignment): Vehicle | undefined {
    return this.assignRoute(vehicleId, newRouteData);
  }

  saveRoundTripSchedules(vehicleId: string, scheduleData: RoundTripSchedule): Vehicle | undefined {
    const v = this.findById(vehicleId);
    if (!v) return undefined;
    v.roundTripSchedule = scheduleData;
    return v;
  }

  updateStatus(vehicleId: string, status: BusStatus): Vehicle | undefined {
    const v = this.findById(vehicleId);
    if (!v) return undefined;
    v.status = status;
    return v;
  }

  decrementSeat(vehicleId: string): boolean {
    const v = this.vehicles.find(v => v.vehicleId === vehicleId);
    if (!v || v.remainingSeats <= 0) return false;
    v.remainingSeats--;
    return true;
  }

  incrementSeat(vehicleId: string): void {
    const v = this.vehicles.find(v => v.vehicleId === vehicleId);
    if (v && v.remainingSeats < v.totalSeats) v.remainingSeats++;
  }

  update(vehicleId: string, data: Partial<Vehicle>): Vehicle | undefined {
    const i = this.vehicles.findIndex(v => v.vehicleId === vehicleId);
    if (i === -1) return undefined;
    this.vehicles[i] = { ...this.vehicles[i], ...data, updatedAt: new Date().toISOString() };
    return this.vehicles[i];
  }

  remove(vehicleId: string): boolean {
    const cleanId = (vehicleId || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const i = this.vehicles.findIndex(
      (v) =>
        v.vehicleId.toLowerCase() === cleanId ||
        v.vehicleNumber.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId
    );
    if (i === -1) return false;
    this.vehicles.splice(i, 1);
    return true;
  }

  removeAll(providerId?: string): number {
    if (!providerId) {
      const count = this.vehicles.length;
      this.vehicles = [];
      return count;
    }
    const cleanP = providerId.trim().toLowerCase();
    const initial = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => (v.providerId || '').toLowerCase() !== cleanP);
    return initial - this.vehicles.length;
  }
}
