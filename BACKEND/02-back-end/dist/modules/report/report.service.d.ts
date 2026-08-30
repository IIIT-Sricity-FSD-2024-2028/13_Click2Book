import { ReportRepository } from './report.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { GenerateReportDto } from './dto/report.dto';
export declare class ReportService {
    private readonly reportRepo;
    private readonly bookingRepo;
    private readonly paymentRepo;
    constructor(reportRepo: ReportRepository, bookingRepo: BookingRepository, paymentRepo: PaymentRepository);
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
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/report.interface").Report[]>;
    findByAdmin(adminId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/report.interface").Report[]>;
    findByDate(date: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/report.interface").Report[]>;
}
