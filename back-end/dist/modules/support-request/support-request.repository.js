"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequestRepository = void 0;
const common_1 = require("@nestjs/common");
const support_status_enum_1 = require("./enums/support-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let SupportRequestRepository = class SupportRequestRepository {
    requests = [
        { requestId: 'SR001', customerId: 'C001', supporterId: 'SUP001', description: 'Unable to cancel booking B001.', status: support_status_enum_1.SupportStatus.RESOLVED, createdDate: '2026-05-01' },
        { requestId: 'SR002', customerId: 'C002', description: 'Payment deducted but booking not confirmed.', status: support_status_enum_1.SupportStatus.OPEN, createdDate: '2026-05-02' },
        { requestId: 'SR003', customerId: 'C003', description: 'Refund not received after 7 days.', status: support_status_enum_1.SupportStatus.IN_PROGRESS, createdDate: '2026-05-03' },
    ];
    create(data) {
        const req = { requestId: (0, id_util_1.generateId)('SR'), ...data, status: support_status_enum_1.SupportStatus.OPEN, createdDate: new Date().toISOString().split('T')[0] };
        this.requests.push(req);
        return req;
    }
    findAll() { return this.requests; }
    findById(requestId) { return this.requests.find(r => r.requestId === requestId); }
    findByCustomer(customerId) { return this.requests.filter(r => r.customerId === customerId); }
    findByStatus(status) { return this.requests.filter(r => r.status === status); }
    findBySupporter(supporterId) { return this.requests.filter(r => r.supporterId === supporterId); }
    update(requestId, data) {
        const i = this.requests.findIndex(r => r.requestId === requestId);
        if (i === -1)
            return undefined;
        this.requests[i] = { ...this.requests[i], ...data };
        return this.requests[i];
    }
};
exports.SupportRequestRepository = SupportRequestRepository;
exports.SupportRequestRepository = SupportRequestRepository = __decorate([
    (0, common_1.Injectable)()
], SupportRequestRepository);
//# sourceMappingURL=support-request.repository.js.map