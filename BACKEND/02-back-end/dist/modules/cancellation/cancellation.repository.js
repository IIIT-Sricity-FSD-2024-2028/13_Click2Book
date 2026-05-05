"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationRepository = void 0;
const common_1 = require("@nestjs/common");
let CancellationRepository = class CancellationRepository {
    cancellations = [];
    create(bookingId) {
        const c = { bookingId, cancelDate: new Date().toISOString().split('T')[0] };
        this.cancellations.push(c);
        return c;
    }
    findAll() { return this.cancellations; }
    findByBooking(bookingId) {
        return this.cancellations.find(c => c.bookingId === bookingId);
    }
};
exports.CancellationRepository = CancellationRepository;
exports.CancellationRepository = CancellationRepository = __decorate([
    (0, common_1.Injectable)()
], CancellationRepository);
//# sourceMappingURL=cancellation.repository.js.map