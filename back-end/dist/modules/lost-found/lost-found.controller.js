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
exports.LostFoundController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lost_found_service_1 = require("./lost-found.service");
const lost_found_dto_1 = require("./dto/lost-found.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let LostFoundController = class LostFoundController {
    lostFoundService;
    constructor(lostFoundService) {
        this.lostFoundService = lostFoundService;
    }
    create(dto) { return this.lostFoundService.create(dto); }
    findAll() { return this.lostFoundService.findAll(); }
    findByProvider(providerId) { return this.lostFoundService.findByProvider(providerId); }
    findByCustomer(customerId) { return this.lostFoundService.findByCustomer(customerId); }
    findOne(id, role, customerId) {
        return this.lostFoundService.findById(id, role, customerId);
    }
    updateStatus(id, dto) {
        return this.lostFoundService.updateStatus(id, dto);
    }
};
exports.LostFoundController = LostFoundController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Report a lost item on a past/current trip (Customer)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lost_found_dto_1.CreateLostFoundItemDto]),
    __metadata("design:returntype", void 0)
], LostFoundController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all lost & found reports (Admin)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LostFoundController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('provider/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Get reports for trips run by this provider (Provider)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'P001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LostFoundController.prototype, "findByProvider", null);
__decorate([
    (0, common_1.Get)('customer/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get reports raised by a customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'C001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LostFoundController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.PROVIDER, role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get a lost & found report by ID (Customer must own it)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'LF001' }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false, example: 'C001', description: 'Required when calling as CUSTOMER' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('x-role')),
    __param(2, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LostFoundController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update report status — FOUND/RETURNED/CLOSED (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'LF001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lost_found_dto_1.UpdateLostFoundStatusDto]),
    __metadata("design:returntype", void 0)
], LostFoundController.prototype, "updateStatus", null);
exports.LostFoundController = LostFoundController = __decorate([
    (0, swagger_1.ApiTags)('Lost & Found'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('lost-found'),
    __metadata("design:paramtypes", [lost_found_service_1.LostFoundService])
], LostFoundController);
//# sourceMappingURL=lost-found.controller.js.map