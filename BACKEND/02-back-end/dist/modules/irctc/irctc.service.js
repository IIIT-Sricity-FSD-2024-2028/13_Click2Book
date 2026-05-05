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
exports.IrctcService = void 0;
const common_1 = require("@nestjs/common");
const irctc_repository_1 = require("./irctc.repository");
const response_util_1 = require("../../common/utils/response.util");
let IrctcService = class IrctcService {
    irctcRepo;
    constructor(irctcRepo) {
        this.irctcRepo = irctcRepo;
    }
    verify(dto) {
        if (this.irctcRepo.findByUsername(dto.irctcUsername))
            throw new common_1.ConflictException(`IRCTC username ${dto.irctcUsername} already submitted`);
        const record = this.irctcRepo.create(dto);
        return (0, response_util_1.successResponse)('IRCTC verification initiated. Status: IN_PROGRESS.', record);
    }
    findAll() { return (0, response_util_1.successResponse)('All IRCTC records', this.irctcRepo.findAll()); }
    findById(id) {
        const r = this.irctcRepo.findById(id);
        if (!r)
            throw new common_1.NotFoundException(`IRCTC record ${id} not found`);
        return (0, response_util_1.successResponse)('IRCTC record', r);
    }
    updateStatus(id, dto) {
        if (!this.irctcRepo.findById(id))
            throw new common_1.NotFoundException(`IRCTC record ${id} not found`);
        return (0, response_util_1.successResponse)('IRCTC status updated', this.irctcRepo.update(id, dto));
    }
};
exports.IrctcService = IrctcService;
exports.IrctcService = IrctcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [irctc_repository_1.IrctcRepository])
], IrctcService);
//# sourceMappingURL=irctc.service.js.map