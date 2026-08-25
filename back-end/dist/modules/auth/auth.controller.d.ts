import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): import("../../common/utils/response.util").ApiResponse<{
        id: string;
        name: string;
        email: string;
        role: string;
    }>;
    testUsers(): import("../../common/utils/response.util").ApiResponse<{
        email: string;
        password: string;
        role: string;
        name: string;
    }[]>;
}
