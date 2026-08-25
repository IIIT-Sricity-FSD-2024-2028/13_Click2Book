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
exports.TrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tracking_service_1 = require("./tracking.service");
const tracking_dto_1 = require("./dto/tracking.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let TrackingController = class TrackingController {
    trackingService;
    constructor(trackingService) {
        this.trackingService = trackingService;
    }
    update(tripId, dto) {
        return this.trackingService.updateLocation(tripId, dto);
    }
    eta(tripId) {
        return this.trackingService.getEta(tripId);
    }
    get(tripId, role, customerId) {
        return this.trackingService.getLocation(tripId, role, customerId);
    }
};
exports.TrackingController = TrackingController;
__decorate([
    (0, common_1.Patch)(':tripId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Update live location for an in-progress trip (Provider, must operate the trip)' }),
    (0, swagger_1.ApiParam)({ name: 'tripId', example: 'T001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('tripId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tracking_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], TrackingController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':tripId/eta'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Estimated arrival for a trip (Customer)' }),
    (0, swagger_1.ApiParam)({ name: 'tripId', example: 'T001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Param)('tripId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrackingController.prototype, "eta", null);
__decorate([
    (0, common_1.Get)(':tripId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER, role_enum_1.Role.ADMIN, role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Get current location for a trip (Customer must hold a booking on it)' }),
    (0, swagger_1.ApiParam)({ name: 'tripId', example: 'T001' }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false, example: 'C001', description: 'Required when calling as CUSTOMER' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Param)('tripId')),
    __param(1, (0, common_1.Headers)('x-role')),
    __param(2, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TrackingController.prototype, "get", null);
exports.TrackingController = TrackingController = __decorate([
    (0, swagger_1.ApiTags)('Tracking'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('tracking'),
    __metadata("design:paramtypes", [tracking_service_1.TrackingService])
], TrackingController);
//# sourceMappingURL=tracking.controller.js.map