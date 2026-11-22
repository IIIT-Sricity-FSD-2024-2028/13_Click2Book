import { VehicleType } from '../enums/vehicle-type.enum';

export type BusStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Inactive';

export interface SeatLayoutItem {
  seatId: string;
  seatNumber: string;
  seatType: 'SEATER' | 'SLEEPER' | 'SINGLE_SLEEPER' | 'DOUBLE_SLEEPER' | 'AISLE' | 'EMPTY';
  deck: 'LOWER' | 'UPPER';
  row: number;
  col: number;
  isActive: boolean;
  berthType?: 'LOWER' | 'UPPER';
}

export interface BusSeatLayoutConfig {
  rows: number;
  cols: number;
  totalSeats: number;
  lowerBerthsCount: number;
  upperBerthsCount: number;
  hasUpperDeck: boolean;
  lowerDeck: SeatLayoutItem[];
  upperDeck: SeatLayoutItem[];
  updatedAt?: string;
}

export interface RouteAssignment {
  assignmentId: string;
  vehicleId: string;
  routeId: string;
  originCity: string;
  destCity: string;
  corridorId: string;
  corridorName: string;
  distanceKm: number;
  durationEst: string;
  intermediateStops: string[];
  assignedAt: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'CANCELLED';
  historical?: boolean;
}

export interface StopTiming {
  stopName: string;
  arrivalTime: string;
  departureTime: string;
}

export interface RoundTripSchedule {
  vehicleId: string;
  assignmentId: string;
  upSchedule: {
    scheduleId: string;
    originCity: string;
    destCity: string;
    departureTime: string;
    arrivalTime: string;
    operatingDays: string[];
    intermediateStops: StopTiming[];
    active: boolean;
  };
  downSchedule: {
    scheduleId: string;
    originCity: string;
    destCity: string;
    departureTime: string;
    arrivalTime: string;
    operatingDays: string[];
    intermediateStops: StopTiming[];
    active: boolean;
  };
  fare: number;
  validFrom: string;
  validUntil?: string;
  restMinutesBetweenJourneys?: number;
}

export interface Vehicle {
  vehicleId: string;
  providerId: string;
  vehicleNumber: string; // Bus registration number (unique)
  vehicleType: VehicleType;
  totalSeats: number;
  remainingSeats: number;
  busName?: string;      // Bus display name
  lowerBerths?: number;
  upperBerths?: number;
  amenities?: string[];
  photographs?: string[];
  status?: BusStatus;
  rating?: number;
  boardingPoint?: string;
  droppingPoint?: string;
  seatLayout?: BusSeatLayoutConfig;
  assignedRoute?: RouteAssignment;
  routeHistory?: RouteAssignment[];
  roundTripSchedule?: RoundTripSchedule;
  createdAt?: string;
  updatedAt?: string;
}
