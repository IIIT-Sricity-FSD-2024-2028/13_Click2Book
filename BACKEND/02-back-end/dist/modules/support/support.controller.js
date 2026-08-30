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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const support_service_1 = require("./support.service");
const support_staff_dto_1 = require("./dto/support-staff.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let SupportController = class SupportController {
    supportService;
    constructor(supportService) {
        this.supportService = supportService;
    }
    create(dto) { return this.supportService.create(dto); }
    findAll() { return this.supportService.findAll(); }
    findOne(id) { return this.supportService.findById(id); }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Add support staff (Admin only)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_staff_dto_1.CreateSupportStaffDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all support staff (Admin only)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPPORT),
    (0, swagger_1.ApiOperation)({ summary: 'Get support staff by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'SUP001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "findOne", null);
exports.SupportController = SupportController = __decorate([
    (0, swagger_1.ApiTags)('Support Staff'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('support-staff'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map