import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { CustomerRepository } from '../../modules/customer/customer.repository';
import { ProviderRepository } from '../../modules/provider/provider.repository';
import { SupportRepository } from '../../modules/support/support.repository';
import { Role } from '../enums/role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard live account status', () => {
  const activate = (role: Role, userId?: string, sessionVersion = '0') => {
    const reflector = {
      getAllAndOverride: () => [role],
    } as unknown as Reflector;
    const customers = new CustomerRepository();
    const providers = new ProviderRepository();
    const support = new SupportRepository();
    const moduleRef = {
      get: (token: unknown) => {
        if (token === CustomerRepository) return customers;
        if (token === ProviderRepository) return providers;
        return support;
      },
    } as unknown as ModuleRef;
    const guard = new RolesGuard(reflector, moduleRef);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-role': role,
            'x-user-id': userId,
            'x-session-version': sessionVersion,
          },
        }),
      }),
    } as unknown as ExecutionContext;
    return { guard, context, customers, providers, support };
  };

  it('rejects an inactive customer and a pre-deactivation session after reactivation', () => {
    const { guard, context, customers } = activate(Role.CUSTOMER, 'C001');
    customers.update('C001', { status: 'INACTIVE', authVersion: 1 });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

    customers.update('C001', { status: 'ACTIVE' });
    expect(() => guard.canActivate(context)).toThrow(
      'Your session is no longer valid. Please log in again.',
    );
  });

  it('rejects a provider existing session immediately after deactivation', () => {
    const { guard, context, providers } = activate(Role.PROVIDER, 'P001');
    providers.update('P001', { status: 'INACTIVE' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects a support employee existing session immediately after deactivation', () => {
    const { guard, context, support } = activate(Role.SUPPORT, 'SUPPORT001');
    support.update('SUPPORT001', { status: 'INACTIVE' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows active provider and support sessions with the issued version', () => {
    for (const role of [Role.PROVIDER, Role.SUPPORT]) {
      const { guard, context } = activate(
        role,
        role === Role.PROVIDER ? 'P001' : 'SUPPORT001',
      );
      expect(guard.canActivate(context)).toBe(true);
    }
  });

  it('requires a current account identity for protected provider and support calls', () => {
    for (const role of [Role.CUSTOMER, Role.PROVIDER, Role.SUPPORT]) {
      const { guard, context } = activate(role);
      expect(() => guard.canActivate(context)).toThrow(
        'Missing x-user-id header',
      );
    }
  });

  it('allows an active customer session with its current version', () => {
    const { guard, context } = activate(Role.CUSTOMER, 'C001');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a pre-deactivation session after the account has been reactivated', () => {
    const { guard, context, providers } = activate(Role.PROVIDER, 'P001');
    providers.update('P001', { status: 'INACTIVE', authVersion: 1 });
    providers.update('P001', { status: 'ACTIVE' });

    expect(() => guard.canActivate(context)).toThrow(
      'Your session is no longer valid. Please log in again.',
    );
  });
});
