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
exports.ScheduleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const schedule_service_1 = require("./schedule.service");
const schedule_dto_1 = require("./dto/schedule.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let ScheduleController = class ScheduleController {
    scheduleService;
    constructor(scheduleService) {
        this.scheduleService = scheduleService;
    }
    create(dto) { return this.scheduleService.create(dto); }
    findAll(providerId, date) {
        return this.scheduleService.findAll(providerId, date);
    }
    findOne(id) { return this.scheduleService.findById(id); }
    update(id, dto) {
        return this.scheduleService.update(id, dto);
    }
    remove(id) { return this.scheduleService.remove(id); }
};
exports.ScheduleController = ScheduleController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new schedule (Provider only)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_dto_1.CreateScheduleDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all schedules (filter by providerId or date)' }),
    (0, swagger_1.ApiQuery)({ name: 'providerId', required: false, example: 'P001' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, example: '2026-06-01' }),
    __param(0, (0, common_1.Query)('providerId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get schedule by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'SCH001' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update schedule (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'SCH001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_dto_1.UpdateScheduleDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete schedule (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'SCH001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "remove", null);
exports.ScheduleController = ScheduleController = __decorate([
    (0, swagger_1.ApiTags)('Schedules'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('schedules'),
    __metadata("design:paramtypes", [schedule_service_1.ScheduleService])
], ScheduleController);
//# sourceMappingURL=schedule.controller.js.map