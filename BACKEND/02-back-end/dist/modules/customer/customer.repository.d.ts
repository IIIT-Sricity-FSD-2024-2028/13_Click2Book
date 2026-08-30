import { Customer } from './interfaces/customer.interface';
export declare class CustomerRepository {
    private customers;
    create(data: Omit<Customer, 'customerId' | 'createdAt'>): Customer;
    findAll(): Customer[];
    findById(customerId: string): Customer | undefined;
    findByEmail(email: string): Customer | undefined;
    findByPhone(phoneNumber: string): Customer | undefined;
    update(customerId: string, data: Partial<Customer>): Customer | undefined;
    remove(customerId: string): boolean;
}
