"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
let ProviderRepository = class ProviderRepository {
    providers = [
        { providerId: 'P001', name: 'APSRTC Travels', email: 'apsrtc@example.com', password: 'hashed_p1', approved: true },
        { providerId: 'P002', name: 'KPN Tours', email: 'kpn@example.com', password: 'hashed_p2', approved: true },
        { providerId: 'P003', name: 'Orange Travels', email: 'orange@example.com', password: 'hashed_p3', approved: false },
    ];
    create(data) {
        const p = { providerId: (0, id_util_1.generateId)('P'), ...data, approved: false };
        this.providers.push(p);
        return p;
    }
    findAll() { return this.providers; }
    findById(providerId) { return this.providers.find(p => p.providerId === providerId); }
    findByEmail(email) { return this.providers.find(p => p.email === email); }
    update(providerId, data) {
        const i = this.providers.findIndex(p => p.providerId === providerId);
        if (i === -1)
            return undefined;
        this.providers[i] = { ...this.providers[i], ...data };
        return this.providers[i];
    }
    remove(providerId) {
        const i = this.providers.findIndex(p => p.providerId === providerId);
        if (i === -1)
            return false;
        this.providers.splice(i, 1);
        return true;
    }
};
exports.ProviderRepository = ProviderRepository;
exports.ProviderRepository = ProviderRepository = __decorate([
    (0, common_1.Injectable)()
], ProviderRepository);
//# sourceMappingURL=provider.repository.js.map