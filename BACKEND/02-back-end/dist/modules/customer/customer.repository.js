"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
const gender_enum_1 = require("./enums/gender.enum");
let CustomerRepository = class CustomerRepository {
    customers = [
        {
            customerId: 'C001',
            name: 'Rahul Verma',
            email: 'rahul@gmail.com',
            password: 'Rahul@123',
            age: 25,
            gender: gender_enum_1.Gender.MALE,
            phoneNumber: '9876543210',
            createdAt: '2026-01-10',
        },
        {
            customerId: 'C002',
            name: 'Priya Sharma',
            email: 'priya@gmail.com',
            password: 'Priya@123',
            age: 24,
            gender: gender_enum_1.Gender.FEMALE,
            phoneNumber: '9876543211',
            createdAt: '2026-01-12',
        },
        {
            customerId: 'C003',
            name: 'Ravi Teja',
            email: 'ravi@gmail.com',
            password: 'Ravi@123',
            age: 28,
            gender: gender_enum_1.Gender.MALE,
            phoneNumber: '9876543212',
            createdAt: '2026-01-15',
        },
        {
            customerId: 'C004',
            name: 'Arjun Singh',
            email: 'arjun@gmail.com',
            password: 'Arjun@123',
            age: 22,
            gender: gender_enum_1.Gender.MALE,
            phoneNumber: '9876543213',
            createdAt: '2026-01-20',
        },
    ];
    create(data) {
        const customer = {
            customerId: (0, id_util_1.generateId)('C'),
            ...data,
            createdAt: new Date().toISOString().split('T')[0],
        };
        this.customers.push(customer);
        return customer;
    }
    findAll() {
        return this.customers;
    }
    findById(customerId) {
        return this.customers.find((c) => c.customerId === customerId);
    }
    findByEmail(email) {
        return this.customers.find((c) => c.email === email);
    }
    findByPhone(phoneNumber) {
        return this.customers.find((c) => c.phoneNumber === phoneNumber);
    }
    update(customerId, data) {
        const index = this.customers.findIndex((c) => c.customerId === customerId);
        if (index === -1)
            return undefined;
        this.customers[index] = { ...this.customers[index], ...data };
        return this.customers[index];
    }
    remove(customerId) {
        const index = this.customers.findIndex((c) => c.customerId === customerId);
        if (index === -1)
            return false;
        this.customers.splice(index, 1);
        return true;
    }
};
exports.CustomerRepository = CustomerRepository;
exports.CustomerRepository = CustomerRepository = __decorate([
    (0, common_1.Injectable)()
], CustomerRepository);
//# sourceMappingURL=customer.repository.js.map