import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { Admin, ROLE_PERMISSIONS } from './interfaces/admin.interface';
import { successResponse } from '../../common/utils/response.util';

/** Never send the password to the client. */
const safe = ({ password, ...rest }: Admin) => rest;

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly paymentRepo: PaymentRepository,
  ) {}

  create(dto: CreateAdminDto) {
    if (this.adminRepo.findByEmail(dto.email))
      throw new ConflictException('Admin email already exists');
    const role = dto.role ?? 'ADMIN';
    const admin = this.adminRepo.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role,
      permissions: dto.permissions ?? [...ROLE_PERMISSIONS[role]],
      status: 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10),
    });
    return successResponse('Admin created', safe(admin));
  }

  findAll() {
    return successResponse('All admins', this.adminRepo.findAll().map(safe));
  }

  findById(id: string) {
    const a = this.adminRepo.findById(id);
    if (!a) throw new NotFoundException(`Admin ${id} not found`);
    return successResponse('Admin retrieved', safe(a));
  }

  /** The platform must always keep at least one active SUPER_ADMIN. `next` = null means delete. */
  private assertKeepsSuperAdmin(id: string, next: Partial<Admin> | null) {
    const current = this.adminRepo.findById(id);
    if (
      !current ||
      current.role !== 'SUPER_ADMIN' ||
      current.status !== 'ACTIVE'
    )
      return;
    const stillSuper =
      !!next &&
      (next.role ?? current.role) === 'SUPER_ADMIN' &&
      (next.status ?? current.status) === 'ACTIVE';
    if (stillSuper) return;
    const others = this.adminRepo
      .findAll()
      .filter(
        (a) =>
          a.adminId !== id && a.role === 'SUPER_ADMIN' && a.status === 'ACTIVE',
      );
    if (others.length === 0)
      throw new BadRequestException(
        'At least one active Super Admin must remain',
      );
  }

  update(id: string, dto: UpdateAdminDto) {
    if (!this.adminRepo.findById(id))
      throw new NotFoundException(`Admin ${id} not found`);
    if (dto.email) {
      const other = this.adminRepo.findByEmail(dto.email);
      if (other && other.adminId !== id)
        throw new ConflictException('Admin email already exists');
    }
    this.assertKeepsSuperAdmin(id, dto);
    // The validation pipe's transform leaves unsent fields as `undefined`; drop them so they don't overwrite stored values.
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<Admin>;
    // Changing the role without an explicit permission list resets to that role's defaults.
    if (dto.role && !dto.permissions)
      patch.permissions = [...ROLE_PERMISSIONS[dto.role]];
    if (!dto.password) delete patch.password;
    return successResponse(
      'Admin updated',
      safe(this.adminRepo.update(id, patch)!),
    );
  }

  setStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    if (!this.adminRepo.findById(id))
      throw new NotFoundException(`Admin ${id} not found`);
    this.assertKeepsSuperAdmin(id, { status });
    return successResponse(
      `Admin ${status === 'ACTIVE' ? 'activated' : 'deactivated'}`,
      safe(this.adminRepo.update(id, { status })!),
    );
  }

  remove(id: string) {
    if (!this.adminRepo.findById(id))
      throw new NotFoundException(`Admin ${id} not found`);
    this.assertKeepsSuperAdmin(id, null);
    this.adminRepo.remove(id);
    return successResponse('Admin deleted');
  }

  recordLogin(id: string) {
    this.adminRepo.update(id, { lastLoginAt: new Date().toISOString() });
  }

  getDashboard() {
    const allBookings = this.bookingRepo.findAll();
    const allPayments = this.paymentRepo.findAll();
    const totalRevenue = allPayments
      .filter((p) => p.paymentStatus === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount - p.discountAmount, 0);

    return successResponse('Admin dashboard', {
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter(
        (b) => b.bookingStatus === 'CONFIRMED',
      ).length,
      cancelledBookings: allBookings.filter(
        (b) => b.bookingStatus === 'CANCELLED',
      ).length,
      totalRevenue: totalRevenue.toFixed(2),
      totalPayments: allPayments.length,
    });
  }
}
