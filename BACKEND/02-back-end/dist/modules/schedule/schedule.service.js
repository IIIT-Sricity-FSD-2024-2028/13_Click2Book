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
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const schedule_repository_1 = require("./schedule.repository");
const response_util_1 = require("../../common/utils/response.util");
let ScheduleService = class ScheduleService {
    scheduleRepo;
    constructor(scheduleRepo) {
        this.scheduleRepo = scheduleRepo;
    }
    create(dto) {
        return (0, response_util_1.successResponse)('Schedule created', this.scheduleRepo.create(dto));
    }
    findAll(providerId, date) {
        if (providerId)
            return (0, response_util_1.successResponse)('Provider schedules', this.scheduleRepo.findByProvider(providerId));
        if (date)
            return (0, response_util_1.successResponse)('Schedules for date', this.scheduleRepo.findByDate(date));
        return (0, response_util_1.successResponse)('All schedules', this.scheduleRepo.findAll());
    }
    findById(id) {
        const s = this.scheduleRepo.findById(id);
        if (!s)
            throw new common_1.NotFoundException(`Schedule ${id} not found`);
        return (0, response_util_1.successResponse)('Schedule retrieved', s);
    }
    update(id, dto) {
        if (!this.scheduleRepo.findById(id))
            throw new common_1.NotFoundException(`Schedule ${id} not found`);
        return (0, response_util_1.successResponse)('Schedule updated', this.scheduleRepo.update(id, dto));
    }
    remove(id) {
        if (!this.scheduleRepo.findById(id))
            throw new common_1.NotFoundException(`Schedule ${id} not found`);
        this.scheduleRepo.remove(id);
        return (0, response_util_1.successResponse)('Schedule deleted');
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_repository_1.ScheduleRepository])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map