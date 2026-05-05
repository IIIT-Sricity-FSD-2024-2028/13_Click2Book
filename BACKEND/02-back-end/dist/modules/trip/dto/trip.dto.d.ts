import { TripStatus } from '../enums/trip-status.enum';
export declare class CreateTripDto {
    scheduleId: string;
    vehicleId: string;
}
export declare class UpdateTripStatusDto {
    tripStatus: TripStatus;
}
