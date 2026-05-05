import { Injectable } from '@nestjs/common';
import { Customer } from './interfaces/customer.interface';
import { generateId } from '../../common/utils/id.util';
import { Gender } from './enums/gender.enum';

@Injectable()
export class CustomerRepository {
  private customers: Customer[] = [
    {
      customerId: 'C001',
      name: 'Rahul Verma',
      email: 'rahul@gmail.com',
      password: 'Rahul@123',
      age: 25,
      gender: Gender.MALE,
      phoneNumber: '9876543210',
      createdAt: '2026-01-10',
    },
    {
      customerId: 'C002',
      name: 'Priya Sharma',
      email: 'priya@gmail.com',
      password: 'Priya@123',
      age: 24,
      gender: Gender.FEMALE,
      phoneNumber: '9876543211',
      createdAt: '2026-01-12',
    },
    {
      customerId: 'C003',
      name: 'Ravi Teja',
      email: 'ravi@gmail.com',
      password: 'Ravi@123',
      age: 28,
      gender: Gender.MALE,
      phoneNumber: '9876543212',
      createdAt: '2026-01-15',
    },
    {
      customerId: 'C004',
      name: 'Arjun Singh',
      email: 'arjun@gmail.com',
      password: 'Arjun@123',
      age: 22,
      gender: Gender.MALE,
      phoneNumber: '9876543213',
      createdAt: '2026-01-20',
    },
  ];

  create(data: Omit<Customer, 'customerId' | 'createdAt'>): Customer {
    const customer: Customer = {
      customerId: generateId('C'),
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.customers.push(customer);
    return customer;
  }

  findAll(): Customer[] {
    return this.customers;
  }

  findById(customerId: string): Customer | undefined {
    return this.customers.find((c) => c.customerId === customerId);
  }

  findByEmail(email: string): Customer | undefined {
    return this.customers.find((c) => c.email === email);
  }

  findByPhone(phoneNumber: string): Customer | undefined {
    return this.customers.find((c) => c.phoneNumber === phoneNumber);
  }

  update(customerId: string, data: Partial<Customer>): Customer | undefined {
    const index = this.customers.findIndex((c) => c.customerId === customerId);
    if (index === -1) return undefined;
    this.customers[index] = { ...this.customers[index], ...data };
    return this.customers[index];
  }

  remove(customerId: string): boolean {
    const index = this.customers.findIndex((c) => c.customerId === customerId);
    if (index === -1) return false;
    this.customers.splice(index, 1);
    return true;
  }
}
