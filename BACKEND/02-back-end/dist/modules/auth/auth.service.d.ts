import { CustomerRepository } from '../customer/customer.repository';
import { LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly customerRepo;
    constructor(customerRepo: CustomerRepository);
    login(dto: LoginDto): import("../../common/utils/response.util").ApiResponse<{
        id: string;
        name: string;
        email: string;
        role: string;
    }>;
    listTestUsers(): import("../../common/utils/response.util").ApiResponse<{
        email: string;
        password: string;
        role: string;
        name: string;
    }[]>;
}
