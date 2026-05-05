import { AdminRepository } from './admin.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { CreateAdminDto } from './dto/admin.dto';
export declare class AdminService {
    private readonly adminRepo;
    private readonly bookingRepo;
    private readonly paymentRepo;
    constructor(adminRepo: AdminRepository, bookingRepo: BookingRepository, paymentRepo: PaymentRepository);
    create(dto: CreateAdminDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/admin.interface").Admin>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/admin.interface").Admin[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/admin.interface").Admin>;
    getDashboard(): import("../../common/utils/response.util").ApiResponse<{
        totalBookings: number;
        confirmedBookings: number;
        cancelledBookings: number;
        totalRevenue: string;
        totalPayments: number;
    }>;
}
