import { VehicleType } from '../enums/vehicle-type.enum';
export declare class CreateVehicleDto {
    providerId: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    totalSeats: number;
}
export declare class UpdateVehicleDto {
    vehicleType?: VehicleType;
    totalSeats?: number;
}
