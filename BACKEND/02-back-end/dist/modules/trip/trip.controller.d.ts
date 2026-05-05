import { TripService } from './trip.service';
import { CreateTripDto, UpdateTripStatusDto } from './dto/trip.dto';
import { TripStatus } from './enums/trip-status.enum';
export declare class TripController {
    private readonly tripService;
    constructor(tripService: TripService);
    create(dto: CreateTripDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/trip.interface").Trip>;
    search(source: string, destination: string, date?: string): import("../../common/utils/response.util").ApiResponse<{
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
    findAll(source?: string, destination?: string, date?: string, status?: TripStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/trip.interface").Trip[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<{
        trip: import("./interfaces/trip.interface").Trip;
        schedule: import("../schedule/interfaces/schedule.interface").Schedule | undefined;
        vehicle: import("../vehicle/interfaces/vehicle.interface").Vehicle | undefined;
    }>;
    updateStatus(id: string, dto: UpdateTripStatusDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/trip.interface").Trip>;
    confirm(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/trip.interface").Trip>;
}
