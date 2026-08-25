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
exports.EmergencyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const emergency_service_1 = require("./emergency.service");
const emergency_dto_1 = require("./dto/emergency.dto");
const emergency_status_enum_1 = require("./enums/emergency-status.enum");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let EmergencyController = class EmergencyController {
    emergencyService;
    constructor(emergencyService) {
        this.emergencyService = emergencyService;
    }
    create(dto) { return this.emergencyService.create(dto); }
    findAll(status) { return this.emergencyService.findAll(status); }
    findOne(id) { return this.emergencyService.findById(id); }
    acknowledge(id) { return this.emergencyService.acknowledge(id); }
    resolve(id) { return this.emergencyService.resolve(id); }
};
exports.EmergencyController = EmergencyController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Raise an SOS alert on a confirmed, in-progress trip (Customer)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [emergency_dto_1.CreateEmergencyAlertDto]),
    __metadata("design:returntype", void 0)
], EmergencyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all emergency alerts (Admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: emergency_status_enum_1.EmergencyStatus }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmergencyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get emergency alert by ID (Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'EMG001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmergencyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/acknowledge'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Acknowledge an open alert (Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'EMG001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmergencyController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve an alert (Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'EMG001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmergencyController.prototype, "resolve", null);
exports.EmergencyController = EmergencyController = __decorate([
    (0, swagger_1.ApiTags)('Emergency'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('emergency'),
    __metadata("design:paramtypes", [emergency_service_1.EmergencyService])
], EmergencyController);
//# sourceMappingURL=emergency.controller.js.map