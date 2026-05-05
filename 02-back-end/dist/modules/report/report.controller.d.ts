import { ReportService } from './report.service';
import { GenerateReportDto } from './dto/report.dto';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    generate(dto: GenerateReportDto): import("../../common/utils/response.util").ApiResponse<{
        breakdownByStatus: {
            CONFIRMED: number;
            CANCELLED: number;
            PENDING: number;
        };
        adminId: string;
        reportDate: string;
        totalBookings: number;
        totalRevenue: number;
    }>;
    findAll(adminId?: string, date?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/report.interface").Report[]>;
}
