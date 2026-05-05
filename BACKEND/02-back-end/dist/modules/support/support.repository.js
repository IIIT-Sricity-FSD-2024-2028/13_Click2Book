"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
let SupportRepository = class SupportRepository {
    staff = [
        { supporterId: 'SUP001', name: 'Rahul Support', email: 'rahul@click2book.com', password: 'hashed_s1' },
        { supporterId: 'SUP002', name: 'Anita Help', email: 'anita@click2book.com', password: 'hashed_s2' },
    ];
    create(data) {
        const s = { supporterId: (0, id_util_1.generateId)('SUP'), ...data };
        this.staff.push(s);
        return s;
    }
    findAll() { return this.staff; }
    findById(id) { return this.staff.find(s => s.supporterId === id); }
    findByEmail(email) { return this.staff.find(s => s.email === email); }
};
exports.SupportRepository = SupportRepository;
exports.SupportRepository = SupportRepository = __decorate([
    (0, common_1.Injectable)()
], SupportRepository);
//# sourceMappingURL=support.repository.js.map