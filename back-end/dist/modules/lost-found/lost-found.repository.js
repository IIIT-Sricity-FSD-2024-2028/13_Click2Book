"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LostFoundRepository = void 0;
const common_1 = require("@nestjs/common");
const lost_found_status_enum_1 = require("./enums/lost-found-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let LostFoundRepository = class LostFoundRepository {
    items = [];
    create(data) {
        const item = {
            itemId: (0, id_util_1.generateId)('LF'),
            ...data,
            status: lost_found_status_enum_1.LostFoundStatus.REPORTED,
            reportedAt: new Date().toISOString(),
        };
        this.items.push(item);
        return item;
    }
    findAll() { return this.items; }
    findById(itemId) { return this.items.find(i => i.itemId === itemId); }
    findByCustomer(customerId) { return this.items.filter(i => i.customerId === customerId); }
    findByTrips(tripIds) { return this.items.filter(i => tripIds.includes(i.tripId)); }
    update(itemId, data) {
        const i = this.items.findIndex(item => item.itemId === itemId);
        if (i === -1)
            return undefined;
        this.items[i] = { ...this.items[i], ...data };
        return this.items[i];
    }
};
exports.LostFoundRepository = LostFoundRepository;
exports.LostFoundRepository = LostFoundRepository = __decorate([
    (0, common_1.Injectable)()
], LostFoundRepository);
//# sourceMappingURL=lost-found.repository.js.map