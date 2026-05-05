"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const customer_repository_1 = require("../customer/customer.repository");
const response_util_1 = require("../../common/utils/response.util");
const STATIC_USERS = [
    { email: 'admin@click2book.com', password: 'Admin@123', role: 'ADMIN', name: 'Admin', id: 'ADMIN001' },
    { email: 'apsrtc@gmail.com', password: 'Apsrtc@123', role: 'PROVIDER', name: 'APSRTC', id: 'P001' },
    { email: 'ksrtc@gmail.com', password: 'Ksrtc@123', role: 'PROVIDER', name: 'KSRTC', id: 'P002' },
    { email: 'support@click2book.com', password: 'Support@123', role: 'SUPPORT', name: 'Support Agent', id: 'SUPPORT001' },
];
let AuthService = class AuthService {
    customerRepo;
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    login(dto) {
        const staticUser = STATIC_USERS.find(u => u.email === dto.email && u.password === dto.password);
        if (staticUser) {
            return (0, response_util_1.successResponse)('Login successful', {
                id: staticUser.id,
                name: staticUser.name,
                email: staticUser.email,
                role: staticUser.role,
            });
        }
        const customer = this.customerRepo.findByEmail(dto.email);
        if (customer && customer.password === dto.password) {
            return (0, response_util_1.successResponse)('Login successful', {
                id: customer.customerId,
                name: customer.name,
                email: customer.email,
                role: 'CUSTOMER',
            });
        }
        throw new common_1.UnauthorizedException('Invalid email or password');
    }
    listTestUsers() {
        const customers = this.customerRepo.findAll().map(c => ({
            email: c.email, password: c.password, role: 'CUSTOMER', name: c.name,
        }));
        const statics = STATIC_USERS.map(u => ({
            email: u.email, password: u.password, role: u.role, name: u.name,
        }));
        return (0, response_util_1.successResponse)('Test credentials', [...statics, ...customers]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customer_repository_1.CustomerRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map