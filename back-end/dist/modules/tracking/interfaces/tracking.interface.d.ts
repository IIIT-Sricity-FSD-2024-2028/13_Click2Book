import { TrackingStatus } from '../enums/tracking-status.enum';
export interface TripLocation {
    tripId: string;
    lat: number;
    lng: number;
    status: TrackingStatus;
    nextStop?: string;
    updatedAt: string;
}
