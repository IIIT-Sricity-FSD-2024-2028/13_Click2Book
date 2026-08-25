import { EmergencyService } from './emergency.service';
import { CreateEmergencyAlertDto } from './dto/emergency.dto';
import { EmergencyStatus } from './enums/emergency-status.enum';
export declare class EmergencyController {
    private readonly emergencyService;
    constructor(emergencyService: EmergencyService);
    create(dto: CreateEmergencyAlertDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
    findAll(status?: EmergencyStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
    acknowledge(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
    resolve(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/emergency.interface").EmergencyAlert>;
}
