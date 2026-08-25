"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyRepository = void 0;
const common_1 = require("@nestjs/common");
const emergency_status_enum_1 = require("./enums/emergency-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let EmergencyRepository = class EmergencyRepository {
    alerts = [];
    create(data) {
        const alert = {
            alertId: (0, id_util_1.generateId)('EMG'),
            ...data,
            status: emergency_status_enum_1.EmergencyStatus.OPEN,
            createdAt: new Date().toISOString(),
        };
        this.alerts.push(alert);
        return alert;
    }
    findAll() { return this.alerts; }
    findById(alertId) { return this.alerts.find(a => a.alertId === alertId); }
    findByStatus(status) { return this.alerts.filter(a => a.status === status); }
    findByCustomer(customerId) { return this.alerts.filter(a => a.customerId === customerId); }
    update(alertId, data) {
        const i = this.alerts.findIndex(a => a.alertId === alertId);
        if (i === -1)
            return undefined;
        this.alerts[i] = { ...this.alerts[i], ...data };
        return this.alerts[i];
    }
};
exports.EmergencyRepository = EmergencyRepository;
exports.EmergencyRepository = EmergencyRepository = __decorate([
    (0, common_1.Injectable)()
], EmergencyRepository);
//# sourceMappingURL=emergency.repository.js.map