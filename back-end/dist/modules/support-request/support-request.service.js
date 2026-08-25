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
exports.SupportRequestService = void 0;
const common_1 = require("@nestjs/common");
const support_request_repository_1 = require("./support-request.repository");
const response_util_1 = require("../../common/utils/response.util");
let SupportRequestService = class SupportRequestService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    create(dto) {
        return (0, response_util_1.successResponse)('Support request raised', this.repo.create(dto));
    }
    findAll(status) {
        if (status)
            return (0, response_util_1.successResponse)('Requests by status', this.repo.findByStatus(status));
        return (0, response_util_1.successResponse)('All support requests', this.repo.findAll());
    }
    findById(id) {
        const r = this.repo.findById(id);
        if (!r)
            throw new common_1.NotFoundException(`Support request ${id} not found`);
        return (0, response_util_1.successResponse)('Support request', r);
    }
    findByCustomer(cid) { return (0, response_util_1.successResponse)('Customer requests', this.repo.findByCustomer(cid)); }
    findBySupporter(sid) { return (0, response_util_1.successResponse)('Assigned tickets', this.repo.findBySupporter(sid)); }
    update(id, dto) {
        if (!this.repo.findById(id))
            throw new common_1.NotFoundException(`Support request ${id} not found`);
        return (0, response_util_1.successResponse)('Support request updated', this.repo.update(id, dto));
    }
};
exports.SupportRequestService = SupportRequestService;
exports.SupportRequestService = SupportRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [support_request_repository_1.SupportRequestRepository])
], SupportRequestService);
//# sourceMappingURL=support-request.service.js.map