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
exports.SupportRequestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const support_request_service_1 = require("./support-request.service");
const support_request_dto_1 = require("./dto/support-request.dto");
const support_status_enum_1 = require("./enums/support-status.enum");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let SupportRequestController = class SupportRequestController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) { return this.service.create(dto); }
    findAll(status) { return this.service.findAll(status); }
    findByCustomer(cid) { return this.service.findByCustomer(cid); }
    findOne(id) { return this.service.findById(id); }
    update(id, dto) {
        return this.service.update(id, dto);
    }
};
exports.SupportRequestController = SupportRequestController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Raise a support request (Customer)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_request_dto_1.CreateSupportRequestDto]),
    __metadata("design:returntype", void 0)
], SupportRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPPORT, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all support requests (Support/Admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: support_status_enum_1.SupportStatus }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportRequestController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('customer/:customerId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get requests raised by a customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', example: 'C001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportRequestController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPPORT, role_enum_1.Role.ADMIN, role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get support request by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'SR001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportRequestController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPPORT, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update support request — assign agent, change status (Support/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'SR001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, support_request_dto_1.UpdateSupportRequestDto]),
    __metadata("design:returntype", void 0)
], SupportRequestController.prototype, "update", null);
exports.SupportRequestController = SupportRequestController = __decorate([
    (0, swagger_1.ApiTags)('Support Requests'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('support-requests'),
    __metadata("design:paramtypes", [support_request_service_1.SupportRequestService])
], SupportRequestController);
//# sourceMappingURL=support-request.controller.js.map