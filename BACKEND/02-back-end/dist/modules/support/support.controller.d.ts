import { SupportService } from './support.service';
import { CreateSupportStaffDto } from './dto/support-staff.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    create(dto: CreateSupportStaffDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-staff.interface").SupportStaff>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-staff.interface").SupportStaff[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-staff.interface").SupportStaff>;
}
