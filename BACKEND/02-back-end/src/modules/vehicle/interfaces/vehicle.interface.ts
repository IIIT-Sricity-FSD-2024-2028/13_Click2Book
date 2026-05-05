import { VehicleType } from '../enums/vehicle-type.enum';

export interface Vehicle {
  vehicleId: string;
  providerId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  totalSeats: number;
  remainingSeats: number;
}
