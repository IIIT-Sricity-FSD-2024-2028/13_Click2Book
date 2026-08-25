import { Admin } from './interfaces/admin.interface';
export declare class AdminRepository {
    private admins;
    create(data: Omit<Admin, 'adminId'>): Admin;
    findAll(): Admin[];
    findById(adminId: string): Admin | undefined;
    findByEmail(email: string): Admin | undefined;
}
