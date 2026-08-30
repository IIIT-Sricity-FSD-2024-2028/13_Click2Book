import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerService {
    private readonly customerRepo;
    constructor(customerRepo: CustomerRepository);
    create(dto: CreateCustomerDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer>;
    update(id: string, dto: UpdateCustomerDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/customer.interface").Customer>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
