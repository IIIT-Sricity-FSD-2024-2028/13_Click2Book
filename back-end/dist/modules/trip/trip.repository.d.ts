import { Trip } from './interfaces/trip.interface';
import { TripStatus } from './enums/trip-status.enum';
export declare class TripRepository {
    private trips;
    create(data: Omit<Trip, 'tripId'>): Trip;
    findAll(): Trip[];
    findById(tripId: string): Trip | undefined;
    findBySchedule(scheduleId: string): Trip[];
    findByVehicle(vehicleId: string): Trip[];
    findByStatus(status: TripStatus): Trip[];
    update(tripId: string, data: Partial<Trip>): Trip | undefined;
    remove(tripId: string): boolean;
}
