"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrctcRepository = void 0;
const common_1 = require("@nestjs/common");
const irctc_status_enum_1 = require("./enums/irctc-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let IrctcRepository = class IrctcRepository {
    records = [
        { irctcId: 'IRCTC001', irctcUsername: 'ravi_irctc', linkedPhoneNumber: '9876543212', verificationStatus: irctc_status_enum_1.IrctcStatus.VERIFIED },
    ];
    create(data) {
        const record = { irctcId: (0, id_util_1.generateId)('IRCTC'), ...data, verificationStatus: irctc_status_enum_1.IrctcStatus.IN_PROGRESS };
        this.records.push(record);
        return record;
    }
    findAll() { return this.records; }
    findById(id) { return this.records.find(r => r.irctcId === id); }
    findByUsername(username) { return this.records.find(r => r.irctcUsername === username); }
    update(id, data) {
        const i = this.records.findIndex(r => r.irctcId === id);
        if (i === -1)
            return undefined;
        this.records[i] = { ...this.records[i], ...data };
        return this.records[i];
    }
};
exports.IrctcRepository = IrctcRepository;
exports.IrctcRepository = IrctcRepository = __decorate([
    (0, common_1.Injectable)()
], IrctcRepository);
//# sourceMappingURL=irctc.repository.js.map