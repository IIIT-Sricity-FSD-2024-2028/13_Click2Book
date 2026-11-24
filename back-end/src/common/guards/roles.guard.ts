import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CustomerRepository } from '../../modules/customer/customer.repository';
import { ProviderRepository } from '../../modules/provider/provider.repository';
import { SupportRepository } from '../../modules/support/support.repository';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles decorator, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const roleHeader = request.headers['x-role'];

    if (typeof roleHeader !== 'string' || !roleHeader) {
      throw new ForbiddenException(
        'Missing x-role header. Provide one of: CUSTOMER, ADMIN, PROVIDER, SUPPORT',
      );
    }

    if (!requiredRoles.includes(roleHeader as Role)) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${roleHeader}`,
      );
    }
    const role = roleHeader as Role;

    // Account status is checked from the live repository on every protected
    // request. The x-role header is not a substitute for authentication and
    // must never be the only source used for account status.
    const userIdHeader = request.headers['x-user-id'];
    const userId = typeof userIdHeader === 'string' ? userIdHeader.trim() : '';
    const sessionVersionHeader = request.headers['x-session-version'];
    if (
      role === Role.CUSTOMER ||
      role === Role.PROVIDER ||
      role === Role.SUPPORT
    ) {
      if (!userId) {
        throw new ForbiddenException(
          'Missing x-user-id header for account status verification',
        );
      }
      if (typeof sessionVersionHeader !== 'string') {
        throw new ForbiddenException(
          'Your session is no longer valid. Please log in again.',
        );
      }
    }
    if (role === Role.CUSTOMER) {
      const repo = this.moduleRef.get(CustomerRepository, { strict: false });
      const account = repo.findById(userId);
      if (
        !account ||
        String(account.status || 'ACTIVE').toUpperCase() === 'INACTIVE'
      ) {
        throw new ForbiddenException(
          'Your account has been deactivated by the administrator. You cannot access protected operations. Please contact customer support for assistance.',
        );
      }
      if (Number(sessionVersionHeader) !== (account.authVersion || 0)) {
        throw new ForbiddenException(
          'Your session is no longer valid. Please log in again.',
        );
      }
    }
    if (role === Role.PROVIDER && userId) {
      const repo = this.moduleRef.get(ProviderRepository, { strict: false });
      const account = repo.findById(userId);
      if (
        !account ||
        String(account.status || 'ACTIVE').toUpperCase() === 'INACTIVE'
      ) {
        throw new ForbiddenException(
          'Your service provider account has been deactivated by the administrator. You cannot access protected operations. Please contact customer support for assistance.',
        );
      }
      if (Number(sessionVersionHeader) !== (account.authVersion || 0)) {
        throw new ForbiddenException(
          'Your session is no longer valid. Please log in again.',
        );
      }
      if (!account.approved) {
        throw new ForbiddenException(
          'Provider account is awaiting admin approval',
        );
      }
    }
    if (role === Role.SUPPORT && userId) {
      const repo = this.moduleRef.get(SupportRepository, { strict: false });
      const account = repo.findById(userId);
      if (
        !account ||
        String(account.status || 'ACTIVE').toUpperCase() === 'INACTIVE'
      ) {
        throw new ForbiddenException(
          'Your customer support account has been deactivated by the administrator. You cannot access protected operations. Please contact your administrator for assistance.',
        );
      }
      if (Number(sessionVersionHeader) !== (account.authVersion || 0)) {
        throw new ForbiddenException(
          'Your session is no longer valid. Please log in again.',
        );
      }
    }

    return true;
  }
}
