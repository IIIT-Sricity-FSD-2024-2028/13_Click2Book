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
exports.VehicleService = void 0;
const common_1 = require("@nestjs/common");
const vehicle_repository_1 = require("./vehicle.repository");
const response_util_1 = require("../../common/utils/response.util");
let VehicleService = class VehicleService {
    vehicleRepo;
    constructor(vehicleRepo) {
        this.vehicleRepo = vehicleRepo;
    }
    create(dto) {
        const existing = this.vehicleRepo.findAll().find(v => v.vehicleNumber === dto.vehicleNumber);
        if (existing)
            throw new common_1.ConflictException(`Vehicle number ${dto.vehicleNumber} already exists`);
        return (0, response_util_1.successResponse)('Vehicle added', this.vehicleRepo.create(dto));
    }
    findAll() { return (0, response_util_1.successResponse)('All vehicles', this.vehicleRepo.findAll()); }
    findById(id) {
        const v = this.vehicleRepo.findById(id);
        if (!v)
            throw new common_1.NotFoundException(`Vehicle ${id} not found`);
        return (0, response_util_1.successResponse)('Vehicle retrieved', v);
    }
    findByProvider(providerId) {
        return (0, response_util_1.successResponse)(`Vehicles for provider ${providerId}`, this.vehicleRepo.findByProvider(providerId));
    }
    update(id, dto) {
        if (!this.vehicleRepo.findById(id))
            throw new common_1.NotFoundException(`Vehicle ${id} not found`);
        return (0, response_util_1.successResponse)('Vehicle updated', this.vehicleRepo.update(id, dto));
    }
    remove(id) {
        if (!this.vehicleRepo.findById(id))
            throw new common_1.NotFoundException(`Vehicle ${id} not found`);
        this.vehicleRepo.remove(id);
        return (0, response_util_1.successResponse)('Vehicle removed');
    }
};
exports.VehicleService = VehicleService;
exports.VehicleService = VehicleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vehicle_repository_1.VehicleRepository])
], VehicleService);
//# sourceMappingURL=vehicle.service.js.map