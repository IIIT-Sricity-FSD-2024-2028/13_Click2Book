"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
let AdminRepository = class AdminRepository {
    admins = [
        { adminId: 'A001', name: 'Super Admin', email: 'admin@click2book.com', password: 'hashed_admin' },
        { adminId: 'A002', name: 'Ops Admin', email: 'ops@click2book.com', password: 'hashed_ops' },
    ];
    create(data) {
        const admin = { adminId: (0, id_util_1.generateId)('A'), ...data };
        this.admins.push(admin);
        return admin;
    }
    findAll() { return this.admins; }
    findById(adminId) { return this.admins.find(a => a.adminId === adminId); }
    findByEmail(email) { return this.admins.find(a => a.email === email); }
};
exports.AdminRepository = AdminRepository;
exports.AdminRepository = AdminRepository = __decorate([
    (0, common_1.Injectable)()
], AdminRepository);
//# sourceMappingURL=admin.repository.js.map