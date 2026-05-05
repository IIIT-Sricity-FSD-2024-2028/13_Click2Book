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
exports.TripController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const trip_service_1 = require("./trip.service");
const trip_dto_1 = require("./dto/trip.dto");
const trip_status_enum_1 = require("./enums/trip-status.enum");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let TripController = class TripController {
    tripService;
    constructor(tripService) {
        this.tripService = tripService;
    }
    create(dto) { return this.tripService.create(dto); }
    search(source, destination, date) {
        return this.tripService.search(source, destination, date || '');
    }
    findAll(source, destination, date, status) {
        if (source && destination)
            return this.tripService.search(source, destination, date || '');
        return this.tripService.findAll(status);
    }
    findOne(id) { return this.tripService.findById(id); }
    updateStatus(id, dto) {
        return this.tripService.updateStatus(id, dto);
    }
    confirm(id) { return this.tripService.confirm(id); }
};
exports.TripController = TripController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a trip — assign vehicle to schedule (Provider)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trip_dto_1.CreateTripDto]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search trips — dedicated search endpoint' }),
    (0, swagger_1.ApiQuery)({ name: 'source', required: true, example: 'Mumbai' }),
    (0, swagger_1.ApiQuery)({ name: 'destination', required: true, example: 'Pune' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, example: '2026-06-01' }),
    __param(0, (0, common_1.Query)('source')),
    __param(1, (0, common_1.Query)('destination')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all trips OR search by source/destination/date' }),
    (0, swagger_1.ApiQuery)({ name: 'source', required: false, example: 'Hyderabad' }),
    (0, swagger_1.ApiQuery)({ name: 'destination', required: false, example: 'Chennai' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, example: '2026-06-01' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: trip_status_enum_1.TripStatus }),
    __param(0, (0, common_1.Query)('source')),
    __param(1, (0, common_1.Query)('destination')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full trip details (trip + schedule + vehicle)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'T001' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update trip status (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'T001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trip_dto_1.UpdateTripStatusDto]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a trip (Provider)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'T001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "confirm", null);
exports.TripController = TripController = __decorate([
    (0, swagger_1.ApiTags)('Trips'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('trips'),
    __metadata("design:paramtypes", [trip_service_1.TripService])
], TripController);
//# sourceMappingURL=trip.controller.js.map