import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomerRepository } from '../customer/customer.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { AdminRepository } from '../admin/admin.repository';
import { SupportRepository } from '../support/support.repository';
import { PlatformService } from '../platform/platform.service';
import { LoginDto } from './dto/auth.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly providerRepo: ProviderRepository,
    private readonly adminRepo: AdminRepository,
    private readonly supportRepo: SupportRepository,
    private readonly platform: PlatformService,
  ) {}

  login(dto: LoginDto) {
    // security.maxLoginAttempts / lockoutMinutes
    this.platform.assertNotLocked(dto.email);
    const result = this.match(dto);
    if (!result) {
      this.platform.loginFailed(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }
    this.platform.loginSucceeded(dto.email);
    return successResponse('Login successful', result);
  }

  private match(dto: LoginDto) {
    // 1. Admin accounts managed by the Super Admin
    const admin = this.adminRepo.findByEmail(dto.email);
    if (admin && admin.password === dto.password) {
      if (admin.status !== 'ACTIVE')
        throw new ForbiddenException('This admin account has been deactivated');
      this.adminRepo.update(admin.adminId, {
        lastLoginAt: new Date().toISOString(),
      });
      return {
        id: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
        adminRole: admin.role,
        permissions: admin.permissions,
      };
    }

    // 2. Support agents
    const agent = this.supportRepo.findByEmail(dto.email);
    if (agent && agent.password === dto.password) {
      return {
        id: agent.supporterId,
        name: agent.name,
        email: agent.email,
        role: 'SUPPORT',
      };
    }

    // 3. Providers
    const provider = this.providerRepo.findByEmail(dto.email);
    if (provider && provider.password === dto.password) {
      return {
        id: provider.providerId,
        name: provider.name,
        email: provider.email,
        role: 'PROVIDER',
        approved: provider.approved,
      };
    }

    // 4. Customers (including newly registered ones)
    const customer = this.customerRepo.findByEmail(dto.email);
    if (customer && customer.password === dto.password) {
      return {
        id: customer.customerId,
        name: customer.name,
        email: customer.email,
        role: 'CUSTOMER',
      };
    }
    return null;
  }

  /** Return all predefined users — useful for Swagger testing */
  listTestUsers() {
    const customers = this.customerRepo.findAll().map((c) => ({
      email: c.email,
      password: c.password,
      role: 'CUSTOMER',
      name: c.name,
    }));
    const providers = this.providerRepo.findAll().map((p) => ({
      email: p.email,
      password: p.password,
      role: 'PROVIDER',
      name: p.name,
    }));
    const admins = this.adminRepo.findAll().map((a) => ({
      email: a.email,
      password: a.password,
      role: 'ADMIN',
      name: a.name,
    }));
    const agents = this.supportRepo.findAll().map((s) => ({
      email: s.email,
      password: s.password,
      role: 'SUPPORT',
      name: s.name,
    }));
    return successResponse('Test credentials', [
      ...admins,
      ...agents,
      ...providers,
      ...customers,
    ]);
  }
}
