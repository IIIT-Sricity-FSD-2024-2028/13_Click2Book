"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequestModule = void 0;
const common_1 = require("@nestjs/common");
const support_request_controller_1 = require("./support-request.controller");
const support_request_service_1 = require("./support-request.service");
const support_request_repository_1 = require("./support-request.repository");
let SupportRequestModule = class SupportRequestModule {
};
exports.SupportRequestModule = SupportRequestModule;
exports.SupportRequestModule = SupportRequestModule = __decorate([
    (0, common_1.Module)({
        controllers: [support_request_controller_1.SupportRequestController],
        providers: [support_request_service_1.SupportRequestService, support_request_repository_1.SupportRequestRepository],
        exports: [support_request_service_1.SupportRequestService, support_request_repository_1.SupportRequestRepository],
    })
], SupportRequestModule);
//# sourceMappingURL=support-request.module.js.map