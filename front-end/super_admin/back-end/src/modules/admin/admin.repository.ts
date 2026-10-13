import { Injectable } from '@nestjs/common';
import { Admin, ROLE_PERMISSIONS } from './interfaces/admin.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class AdminRepository {
  private admins: Admin[] = [
    {
      adminId: 'A001',
      name: 'Super Admin',
      email: 'admin@click2book.com',
      password: 'Admin@123',
      role: 'SUPER_ADMIN',
      permissions: [...ROLE_PERMISSIONS.SUPER_ADMIN],
      status: 'ACTIVE',
      createdAt: '2026-01-01',
    },
    {
      adminId: 'A002',
      name: 'Ops Admin',
      email: 'ops@click2book.com',
      password: 'Ops@123',
      role: 'ADMIN',
      permissions: [...ROLE_PERMISSIONS.ADMIN],
      status: 'ACTIVE',
      createdAt: '2026-01-05',
    },
  ];

  create(data: Omit<Admin, 'adminId'>): Admin {
    const admin: Admin = { adminId: generateId('A'), ...data };
    this.admins.push(admin);
    return admin;
  }

  findAll(): Admin[] {
    return this.admins;
  }
  findById(adminId: string): Admin | undefined {
    return this.admins.find((a) => a.adminId === adminId);
  }
  findByEmail(email: string): Admin | undefined {
    return this.admins.find(
      (a) => a.email.toLowerCase() === String(email).toLowerCase(),
    );
  }

  update(adminId: string, data: Partial<Admin>): Admin | undefined {
    const i = this.admins.findIndex((a) => a.adminId === adminId);
    if (i === -1) return undefined;
    this.admins[i] = { ...this.admins[i], ...data };
    return this.admins[i];
  }

  remove(adminId: string): boolean {
    const i = this.admins.findIndex((a) => a.adminId === adminId);
    if (i === -1) return false;
    this.admins.splice(i, 1);
    return true;
  }
}
