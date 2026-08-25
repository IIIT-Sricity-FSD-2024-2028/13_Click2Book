import { EmergencyRepository } from './emergency.repository';
import { BookingRepository } from '../booking/booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { CreateEmergencyAlertDto } from './dto/emergency.dto';
import { EmergencyStatus } from './enums/emergency-status.enum';
export declare class EmergencyService {
    private readonly emergencyRepo;
    private readonly bookingRepo;
    private readonly tripRepo;
    constructor(emergencyRepo: EmergencyRepository, bookingRepo: BookingRepository, tripRepo: TripRepository);
    create(dto: CreateEmergencyAlertDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
    findAll(status?: EmergencyStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
    acknowledge(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
    resolve(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
}
