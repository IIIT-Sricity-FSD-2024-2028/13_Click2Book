import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/payment.dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    processPayment(dto: CreatePaymentDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
    findByBooking(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/payment.interface").Payment>;
}
