import { SupportStaff } from './interfaces/support-staff.interface';
export declare class SupportRepository {
    private staff;
    create(data: Omit<SupportStaff, 'supporterId'>): SupportStaff;
    findAll(): SupportStaff[];
    findById(id: string): SupportStaff | undefined;
    findByEmail(email: string): SupportStaff | undefined;
}
