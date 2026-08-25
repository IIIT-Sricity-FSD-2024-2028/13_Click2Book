import { TripLocation } from './interfaces/tracking.interface';
export declare class TrackingRepository {
    private locations;
    findByTrip(tripId: string): TripLocation | undefined;
    upsert(tripId: string, data: Partial<Omit<TripLocation, 'tripId' | 'updatedAt'>>): TripLocation;
}
