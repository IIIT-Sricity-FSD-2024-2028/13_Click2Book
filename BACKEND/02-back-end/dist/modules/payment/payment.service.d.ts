import { PaymentRepository } from './payment.repository';
import { BookingService } from '../booking/booking.service';
import { BookingRepository } from '../booking/booking.repository';
import { CreatePaymentDto } from './dto/payment.dto';
export declare class PaymentService {
    private readonly paymentRepo;
    private readonly bookingRepo;
    private readonly bookingService;
    constructor(paymentRepo: PaymentRepository, bookingRepo: BookingRepository, bookingService: BookingService);
    processPayment(dto: CreatePaymentDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
    findByBooking(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
    markRefunded(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
}
