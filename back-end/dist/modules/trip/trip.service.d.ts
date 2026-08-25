import { TripRepository } from './trip.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { RouteRepository } from '../route/route.repository';
import { Trip } from './interfaces/trip.interface';
import { CreateTripDto, UpdateTripStatusDto } from './dto/trip.dto';
import { TripStatus } from './enums/trip-status.enum';
export declare class TripService {
    private readonly tripRepo;
    private readonly scheduleRepo;
    private readonly vehicleRepo;
    private readonly seatRepo;
    private readonly routeRepo;
    constructor(tripRepo: TripRepository, scheduleRepo: ScheduleRepository, vehicleRepo: VehicleRepository, seatRepo: SeatRepository, routeRepo: RouteRepository);
    create(dto: CreateTripDto): import("../../common/utils/response.util").ApiResponse<Trip>;
    findAll(status?: TripStatus): import("../../common/utils/response.util").ApiResponse<Trip[]>;
    private calcDuration;
    search(source: string, destination: string, date: string): import("../../common/utils/response.util").ApiResponse<{
        tripId: string;
        scheduleId: string;
        vehicleId: string;
        busName: any;
        providerName: string;
        source: string;
        destination: string;
        departureTime: string;
        arrivalTime: string;
        duration: string;
        journeyDate: string;
        price: number;
        availableSeats: number;
        totalSeats: number;
        vehicleType: import("../vehicle/enums/vehicle-type.enum").VehicleType;
        amenities: any;
        boardingPoint: any;
        droppingPoint: any;
        rating: any;
        tripStatus: TripStatus;
        distance: number;
    }[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<{
        trip: Trip;
        schedule: import("../schedule/interfaces/schedule.interface").Schedule | undefined;
        vehicle: import("../vehicle/interfaces/vehicle.interface").Vehicle | undefined;
    }>;
    updateStatus(id: string, dto: UpdateTripStatusDto): import("../../common/utils/response.util").ApiResponse<Trip>;
    confirm(id: string): import("../../common/utils/response.util").ApiResponse<Trip>;
}
