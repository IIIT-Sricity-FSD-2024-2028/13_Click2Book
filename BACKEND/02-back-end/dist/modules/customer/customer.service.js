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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const customer_repository_1 = require("./customer.repository");
const response_util_1 = require("../../common/utils/response.util");
let CustomerService = class CustomerService {
    customerRepo;
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    create(dto) {
        if (this.customerRepo.findByEmail(dto.email))
            throw new common_1.ConflictException('Email already registered');
        if (this.customerRepo.findByPhone(dto.phoneNumber))
            throw new common_1.ConflictException('Phone number already registered');
        const customer = this.customerRepo.create(dto);
        return (0, response_util_1.successResponse)('Customer registered successfully', customer);
    }
    findAll() {
        return (0, response_util_1.successResponse)('All customers retrieved', this.customerRepo.findAll());
    }
    findById(id) {
        const customer = this.customerRepo.findById(id);
        if (!customer)
            throw new common_1.NotFoundException(`Customer ${id} not found`);
        return (0, response_util_1.successResponse)('Customer retrieved', customer);
    }
    update(id, dto) {
        const customer = this.customerRepo.findById(id);
        if (!customer)
            throw new common_1.NotFoundException(`Customer ${id} not found`);
        const updated = this.customerRepo.update(id, dto);
        return (0, response_util_1.successResponse)('Customer updated successfully', updated);
    }
    remove(id) {
        const exists = this.customerRepo.findById(id);
        if (!exists)
            throw new common_1.NotFoundException(`Customer ${id} not found`);
        this.customerRepo.remove(id);
        return (0, response_util_1.successResponse)('Customer deleted successfully');
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customer_repository_1.CustomerRepository])
], CustomerService);
//# sourceMappingURL=customer.service.js.map