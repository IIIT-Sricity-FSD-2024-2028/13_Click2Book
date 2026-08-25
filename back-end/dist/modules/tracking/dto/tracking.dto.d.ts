import { TrackingStatus } from '../enums/tracking-status.enum';
export declare class UpdateLocationDto {
    providerId: string;
    lat: number;
    lng: number;
    status: TrackingStatus;
    nextStop?: string;
}
