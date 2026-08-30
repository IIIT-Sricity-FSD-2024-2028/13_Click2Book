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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vehicle_service_1 = require("./vehicle.service");
const vehicle_dto_1 = require("./dto/vehicle.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let VehicleController = class VehicleController {
    vehicleService;
    constructor(vehicleService) {
        this.vehicleService = vehicleService;
    }
    create(dto) { return this.vehicleService.create(dto); }
    findAll(providerId) {
        if (providerId)
            return this.vehicleService.findByProvider(providerId);
        return this.vehicleService.findAll();
    }
    findOne(id) { return this.vehicleService.findById(id); }
    update(id, dto) {
        return this.vehicleService.update(id, dto);
    }
    remove(id) { return this.vehicleService.remove(id); }
};
exports.VehicleController = VehicleController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new vehicle (Provider only)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vehicle_dto_1.CreateVehicleDto]),
    __metadata("design:returntype", void 0)
], VehicleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all vehicles' }),
    (0, swagger_1.ApiQuery)({ name: 'providerId', required: false, example: 'P001' }),
    __param(0, (0, common_1.Query)('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'V001' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update vehicle (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'V001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vehicle_dto_1.UpdateVehicleDto]),
    __metadata("design:returntype", void 0)
], VehicleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete vehicle (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'V001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleController.prototype, "remove", null);
exports.VehicleController = VehicleController = __decorate([
    (0, swagger_1.ApiTags)('Vehicles'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('vehicles'),
    __metadata("design:paramtypes", [vehicle_service_1.VehicleService])
], VehicleController);
//# sourceMappingURL=vehicle.controller.js.map