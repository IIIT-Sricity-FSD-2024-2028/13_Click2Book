import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    create(dto: CreateCustomerDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer>;
    update(id: string, dto: UpdateCustomerDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
