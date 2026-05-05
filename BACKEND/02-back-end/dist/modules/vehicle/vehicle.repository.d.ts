import { Vehicle } from './interfaces/vehicle.interface';
export declare class VehicleRepository {
    private vehicles;
    create(data: Omit<Vehicle, 'vehicleId' | 'remainingSeats'>): Vehicle;
    findAll(): Vehicle[];
    findById(vehicleId: string): Vehicle | undefined;
    findByProvider(providerId: string): Vehicle[];
    decrementSeat(vehicleId: string): boolean;
    incrementSeat(vehicleId: string): void;
    update(vehicleId: string, data: Partial<Vehicle>): Vehicle | undefined;
    remove(vehicleId: string): boolean;
}
