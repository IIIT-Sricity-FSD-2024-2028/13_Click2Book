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
exports.ProviderService = void 0;
const common_1 = require("@nestjs/common");
const provider_repository_1 = require("./provider.repository");
const vehicle_repository_1 = require("../vehicle/vehicle.repository");
const schedule_repository_1 = require("../schedule/schedule.repository");
const response_util_1 = require("../../common/utils/response.util");
let ProviderService = class ProviderService {
    providerRepo;
    vehicleRepo;
    scheduleRepo;
    constructor(providerRepo, vehicleRepo, scheduleRepo) {
        this.providerRepo = providerRepo;
        this.vehicleRepo = vehicleRepo;
        this.scheduleRepo = scheduleRepo;
    }
    create(dto) {
        if (this.providerRepo.findByEmail(dto.email))
            throw new common_1.ConflictException('Provider email already exists');
        return (0, response_util_1.successResponse)('Provider registered (awaiting admin approval)', this.providerRepo.create(dto));
    }
    findAll() { return (0, response_util_1.successResponse)('All providers', this.providerRepo.findAll()); }
    findById(id) {
        const p = this.providerRepo.findById(id);
        if (!p)
            throw new common_1.NotFoundException(`Provider ${id} not found`);
        return (0, response_util_1.successResponse)('Provider retrieved', p);
    }
    update(id, dto) {
        if (!this.providerRepo.findById(id))
            throw new common_1.NotFoundException(`Provider ${id} not found`);
        return (0, response_util_1.successResponse)('Provider updated', this.providerRepo.update(id, dto));
    }
    approve(id) {
        if (!this.providerRepo.findById(id))
            throw new common_1.NotFoundException(`Provider ${id} not found`);
        return (0, response_util_1.successResponse)('Provider approved', this.providerRepo.update(id, { approved: true }));
    }
    remove(id) {
        if (!this.providerRepo.findById(id))
            throw new common_1.NotFoundException(`Provider ${id} not found`);
        this.providerRepo.remove(id);
        return (0, response_util_1.successResponse)('Provider removed');
    }
    getDashboard(providerId) {
        const provider = this.providerRepo.findById(providerId);
        if (!provider)
            throw new common_1.NotFoundException(`Provider ${providerId} not found`);
        const vehicles = this.vehicleRepo.findByProvider(providerId);
        const schedules = this.scheduleRepo.findByProvider(providerId);
        const totalSeats = vehicles.reduce((s, v) => s + v.totalSeats, 0);
        const bookedSeats = vehicles.reduce((s, v) => s + (v.totalSeats - v.remainingSeats), 0);
        return (0, response_util_1.successResponse)('Provider dashboard', {
            provider: provider.name,
            totalVehicles: vehicles.length,
            totalSchedules: schedules.length,
            totalSeats,
            bookedSeats,
            availableSeats: totalSeats - bookedSeats,
        });
    }
};
exports.ProviderService = ProviderService;
exports.ProviderService = ProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_repository_1.ProviderRepository,
        vehicle_repository_1.VehicleRepository,
        schedule_repository_1.ScheduleRepository])
], ProviderService);
//# sourceMappingURL=provider.service.js.map