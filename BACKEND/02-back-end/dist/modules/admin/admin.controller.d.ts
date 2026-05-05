import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/admin.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    create(dto: CreateAdminDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/admin.interface").Admin>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/admin.interface").Admin[]>;
    getDashboard(): import("../../common/utils/response.util").ApiResponse<{
        totalBookings: number;
        confirmedBookings: number;
        cancelledBookings: number;
        totalRevenue: string;
        totalPayments: number;
    }>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/admin.interface").Admin>;
}
