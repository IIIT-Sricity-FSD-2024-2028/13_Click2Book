"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrctcModule = void 0;
const common_1 = require("@nestjs/common");
const irctc_controller_1 = require("./irctc.controller");
const irctc_service_1 = require("./irctc.service");
const irctc_repository_1 = require("./irctc.repository");
let IrctcModule = class IrctcModule {
};
exports.IrctcModule = IrctcModule;
exports.IrctcModule = IrctcModule = __decorate([
    (0, common_1.Module)({
        controllers: [irctc_controller_1.IrctcController],
        providers: [irctc_service_1.IrctcService, irctc_repository_1.IrctcRepository],
        exports: [irctc_service_1.IrctcService, irctc_repository_1.IrctcRepository],
    })
], IrctcModule);
//# sourceMappingURL=irctc.module.js.map