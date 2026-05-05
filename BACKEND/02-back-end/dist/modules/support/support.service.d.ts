import { SupportRepository } from './support.repository';
import { CreateSupportStaffDto } from './dto/support-staff.dto';
export declare class SupportService {
    private readonly supportRepo;
    constructor(supportRepo: SupportRepository);
    create(dto: CreateSupportStaffDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-staff.interface").SupportStaff>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-staff.interface").SupportStaff[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-staff.interface").SupportStaff>;
}
