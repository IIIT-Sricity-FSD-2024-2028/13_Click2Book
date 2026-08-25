import { Injectable } from '@nestjs/common';
import { TripLocation } from './interfaces/tracking.interface';
import { TrackingStatus } from './enums/tracking-status.enum';

@Injectable()
export class TrackingRepository {
  private locations: TripLocation[] = [];

  findByTrip(tripId: string): TripLocation | undefined {
    return this.locations.find(l => l.tripId === tripId);
  }

  // Creates the location row on first update for a trip, otherwise merges in place
  upsert(tripId: string, data: Partial<Omit<TripLocation, 'tripId' | 'updatedAt'>>): TripLocation {
    let location = this.findByTrip(tripId);
    if (!location) {
      location = { tripId, lat: 0, lng: 0, status: TrackingStatus.AT_STOP, updatedAt: new Date().toISOString() };
      this.locations.push(location);
    }
    Object.assign(location, data, { updatedAt: new Date().toISOString() });
    return location;
  }
}
