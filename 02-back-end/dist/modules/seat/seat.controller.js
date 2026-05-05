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
exports.SeatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seat_service_1 = require("./seat.service");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let SeatController = class SeatController {
    seatService;
    constructor(seatService) {
        this.seatService = seatService;
    }
    getByVehicle(vehicleId) {
        return this.seatService.getByVehicle(vehicleId);
    }
    getAvailable(vehicleId) {
        return this.seatService.getAvailableByVehicle(vehicleId);
    }
    block(vehicleId, seatNumber) {
        return this.seatService.blockSeat(vehicleId, +seatNumber);
    }
    release(vehicleId, seatNumber) {
        return this.seatService.releaseSeat(vehicleId, +seatNumber);
    }
};
exports.SeatController = SeatController;
__decorate([
    (0, common_1.Get)('vehicle/:vehicleId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all seats for a vehicle' }),
    (0, swagger_1.ApiParam)({ name: 'vehicleId', example: 'V001' }),
    __param(0, (0, common_1.Param)('vehicleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SeatController.prototype, "getByVehicle", null);
__decorate([
    (0, common_1.Get)('vehicle/:vehicleId/available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available seats for a vehicle' }),
    (0, swagger_1.ApiParam)({ name: 'vehicleId', example: 'V001' }),
    __param(0, (0, common_1.Param)('vehicleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SeatController.prototype, "getAvailable", null);
__decorate([
    (0, common_1.Patch)('vehicle/:vehicleId/seat/:seatNumber/block'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Block a seat (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'vehicleId', example: 'V001' }),
    (0, swagger_1.ApiParam)({ name: 'seatNumber', example: '5' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('vehicleId')),
    __param(1, (0, common_1.Param)('seatNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SeatController.prototype, "block", null);
__decorate([
    (0, common_1.Patch)('vehicle/:vehicleId/seat/:seatNumber/release'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Release a seat (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'vehicleId', example: 'V001' }),
    (0, swagger_1.ApiParam)({ name: 'seatNumber', example: '5' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('vehicleId')),
    __param(1, (0, common_1.Param)('seatNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SeatController.prototype, "release", null);
exports.SeatController = SeatController = __decorate([
    (0, swagger_1.ApiTags)('Seats'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('seats'),
    __metadata("design:paramtypes", [seat_service_1.SeatService])
], SeatController);
//# sourceMappingURL=seat.controller.js.map