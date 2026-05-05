"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRepository = void 0;
const common_1 = require("@nestjs/common");
let ReportRepository = class ReportRepository {
    reports = [];
    save(report) {
        const existing = this.reports.findIndex(r => r.adminId === report.adminId && r.reportDate === report.reportDate);
        if (existing !== -1) {
            this.reports[existing] = report;
            return report;
        }
        this.reports.push(report);
        return report;
    }
    findAll() { return this.reports; }
    findByAdmin(adminId) { return this.reports.filter(r => r.adminId === adminId); }
    findByDate(reportDate) { return this.reports.filter(r => r.reportDate === reportDate); }
};
exports.ReportRepository = ReportRepository;
exports.ReportRepository = ReportRepository = __decorate([
    (0, common_1.Injectable)()
], ReportRepository);
//# sourceMappingURL=report.repository.js.map