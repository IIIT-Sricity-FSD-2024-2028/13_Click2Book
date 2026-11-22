import { Injectable } from '@nestjs/common';
import { Vehicle, BusSeatLayoutConfig, RouteAssignment, RoundTripSchedule, BusStatus } from './interfaces/vehicle.interface';
import { generateId } from '../../common/utils/id.util';
import { VehicleType } from './enums/vehicle-type.enum';

@Injectable()
export class VehicleRepository {
  private vehicles: Vehicle[] = [
    // APSRTC Provider (P001) - Initial Registered Buses
    {
      vehicleId: 'V001',
      providerId: 'P001',
      vehicleNumber: 'AP 27 AB 1234',
      vehicleType: VehicleType.VOLVO,
      busName: 'APSRTC Garuda Plus Multi-Axle',
      totalSeats: 40,
      remainingSeats: 38,
      lowerBerths: 20,
      upperBerths: 20,
      status: 'Assigned',
      amenities: ['AC', 'Charging point', 'Wi-Fi', 'Water bottle', 'Reading light', 'Blanket', 'GPS'],
      rating: 4.8,
      assignedRoute: {
        assignmentId: 'ASGN_V001_01',
        vehicleId: 'V001',
        routeId: 'R010',
        originCity: 'Chennai',
        destCity: 'Vijayawada',
        corridorId: 'CORR_CHN_BZA_A',
        corridorName: 'Corridor A: NH16 Coastal Corridor',
        distanceKm: 430,
        durationEst: '6h 45m',
        intermediateStops: ['Tada', 'Nayudupeta', 'Nellore', 'Kavali', 'Ongole', 'Guntur'],
        assignedAt: '2026-06-01T00:00:00.000Z',
        effectiveDate: '2026-06-01',
        status: 'ACTIVE',
      },
      roundTripSchedule: {
        vehicleId: 'V001',
        assignmentId: 'ASGN_V001_01',
        upSchedule: {
          scheduleId: 'SCH_UP_V001',
          originCity: 'Chennai',
          destCity: 'Vijayawada',
          departureTime: '06:00',
          arrivalTime: '14:30',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          intermediateStops: [
            { stopName: 'Tada', arrivalTime: '07:15', departureTime: '07:25' },
            { stopName: 'Nayudupeta', arrivalTime: '08:00', departureTime: '08:15' },
            { stopName: 'Nellore', arrivalTime: '09:30', departureTime: '09:45' },
            { stopName: 'Kavali', arrivalTime: '10:45', departureTime: '11:00' },
            { stopName: 'Ongole', arrivalTime: '12:00', departureTime: '12:20' },
            { stopName: 'Guntur', arrivalTime: '13:40', departureTime: '13:55' },
          ],
          active: true,
        },
        downSchedule: {
          scheduleId: 'SCH_DN_V001',
          originCity: 'Vijayawada',
          destCity: 'Chennai',
          departureTime: '20:00',
          arrivalTime: '04:30',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          intermediateStops: [
            { stopName: 'Guntur', arrivalTime: '20:35', departureTime: '20:50' },
            { stopName: 'Ongole', arrivalTime: '22:10', departureTime: '22:30' },
            { stopName: 'Kavali', arrivalTime: '23:30', departureTime: '23:45' },
            { stopName: 'Nellore', arrivalTime: '00:50', departureTime: '01:05' },
            { stopName: 'Nayudupeta', arrivalTime: '02:20', departureTime: '02:35' },
            { stopName: 'Tada', arrivalTime: '03:15', departureTime: '03:25' },
          ],
          active: true,
        },
        fare: 650,
        validFrom: '2026-06-01',
        restMinutesBetweenJourneys: 330,
      },
    },
    {
      vehicleId: 'V002',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 1001',
      vehicleType: VehicleType.SLEEPER,
      busName: 'APSRTC Amaravathi Super Luxury',
      totalSeats: 36,
      remainingSeats: 32,
      lowerBerths: 18,
      upperBerths: 18,
      status: 'Assigned',
      amenities: ['AC', 'Charging point', 'Reading light', 'Blanket', 'GPS'],
      rating: 4.6,
      assignedRoute: {
        assignmentId: 'ASGN_V002_01',
        vehicleId: 'V002',
        routeId: 'R001',
        originCity: 'Chennai',
        destCity: 'Guntur',
        corridorId: 'CORR_CHN_GNT_A',
        corridorName: 'Corridor A: NH16 Coastal Corridor',
        distanceKm: 415,
        durationEst: '6h 45m',
        intermediateStops: ['Tada', 'Nayudupeta', 'Nellore', 'Kavali', 'Ongole', 'Chirala', 'Bapatla'],
        assignedAt: '2026-06-01T00:00:00.000Z',
        effectiveDate: '2026-06-01',
        status: 'ACTIVE',
      },
    },
    {
      vehicleId: 'V003',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 2002',
      vehicleType: VehicleType.AC_SEATER,
      busName: 'APSRTC Rajadhani Express',
      totalSeats: 45,
      remainingSeats: 40,
      status: 'Available',
      amenities: ['AC', 'Charging point', 'Water bottle', 'GPS'],
      rating: 4.4,
    },
    {
      vehicleId: 'V004',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 3003',
      vehicleType: VehicleType.SEMI_SLEEPER,
      busName: 'APSRTC Deluxe Semi-Sleeper',
      totalSeats: 40,
      remainingSeats: 35,
      status: 'Maintenance',
      amenities: ['Charging point', 'Water bottle', 'GPS'],
      rating: 4.2,
    },
    {
      vehicleId: 'V005',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 4004',
      vehicleType: VehicleType.NON_AC,
      busName: 'APSRTC Ultra Deluxe Non-AC',
      totalSeats: 48,
      remainingSeats: 45,
      status: 'Available',
      amenities: ['Charging point', 'GPS'],
      rating: 4.0,
    },
    {
      vehicleId: 'V006',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 5005',
      vehicleType: VehicleType.VOLVO,
      busName: 'APSRTC Garuda Multi-Axle B12',
      totalSeats: 40,
      remainingSeats: 36,
      status: 'Available',
      amenities: ['AC', 'Wi-Fi', 'Charging point', 'Blanket', 'GPS'],
      rating: 4.7,
    },
    {
      vehicleId: 'V007',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 6006',
      vehicleType: VehicleType.SLEEPER,
      busName: 'APSRTC Night Rider AC Sleeper',
      totalSeats: 36,
      remainingSeats: 30,
      status: 'Available',
      amenities: ['AC', 'Wi-Fi', 'Blanket', 'Pillow', 'Reading light', 'GPS'],
      rating: 4.8,
    },
    {
      vehicleId: 'V008',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 7007',
      vehicleType: VehicleType.AC_SEATER,
      busName: 'APSRTC InterCity AC Seater',
      totalSeats: 44,
      remainingSeats: 40,
      status: 'Available',
      amenities: ['AC', 'Charging point', 'Water bottle', 'GPS'],
      rating: 4.3,
    },
    {
      vehicleId: 'V009',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 8008',
      vehicleType: VehicleType.SEMI_SLEEPER,
      busName: 'APSRTC High-Deck Coach',
      totalSeats: 40,
      remainingSeats: 38,
      status: 'Available',
      amenities: ['AC', 'Charging point', 'Reclining Seats', 'GPS'],
      rating: 4.5,
    },
    {
      vehicleId: 'V010',
      providerId: 'P001',
      vehicleNumber: 'AP 03 TC 9009',
      vehicleType: VehicleType.LUXURY,
      busName: 'APSRTC Platinum Executive Coach',
      totalSeats: 36,
      remainingSeats: 36,
      status: 'Available',
      amenities: ['AC', 'Wi-Fi', 'Personal TV', 'Water bottle', 'Blanket', 'GPS'],
      rating: 4.9,
    },
    // Other providers
    {
      vehicleId: 'V011',
      providerId: 'P002',
      vehicleNumber: 'KA 01 AB 9999',
      vehicleType: VehicleType.VOLVO,
      busName: 'KPN Tours Volvo Multi-Axle',
      totalSeats: 40,
      remainingSeats: 35,
      status: 'Available',
      amenities: ['AC', 'Wi-Fi', 'Charging point'],
      rating: 4.6,
    },
  ];

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

  findAll(): Vehicle[] { return this.vehicles; }
  findById(vehicleId: string): Vehicle | undefined { return this.vehicles.find(v => v.vehicleId === vehicleId); }
  findByProvider(providerId: string): Vehicle[] { return this.vehicles.filter(v => v.providerId === providerId); }

  findByRegistration(vehicleNumber: string): Vehicle | undefined {
    return this.vehicles.find(
      (v) => v.vehicleNumber.trim().toLowerCase() === vehicleNumber.trim().toLowerCase()
    );
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
    const i = this.vehicles.findIndex(v => v.vehicleId === vehicleId);
    if (i === -1) return false;
    this.vehicles.splice(i, 1);
    return true;
  }
}
