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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const support_repository_1 = require("./support.repository");
const response_util_1 = require("../../common/utils/response.util");
let SupportService = class SupportService {
    supportRepo;
    constructor(supportRepo) {
        this.supportRepo = supportRepo;
    }
    create(dto) {
        if (this.supportRepo.findByEmail(dto.email))
            throw new common_1.ConflictException('Support staff email already exists');
        return (0, response_util_1.successResponse)('Support staff created', this.supportRepo.create(dto));
    }
    findAll() { return (0, response_util_1.successResponse)('All support staff', this.supportRepo.findAll()); }
    findById(id) {
        const s = this.supportRepo.findById(id);
        if (!s)
            throw new common_1.NotFoundException(`Support staff ${id} not found`);
        return (0, response_util_1.successResponse)('Support staff retrieved', s);
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [support_repository_1.SupportRepository])
], SupportService);
//# sourceMappingURL=support.service.js.map