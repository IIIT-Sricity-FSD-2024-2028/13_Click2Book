import { TripStatus } from '../enums/trip-status.enum';

export interface Trip {
  tripId: string;
  scheduleId: string;
  vehicleId: string;
  tripStatus: TripStatus;
}
