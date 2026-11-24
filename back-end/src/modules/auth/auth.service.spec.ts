import { CustomerRepository } from '../customer/customer.repository';
import { CustomerService } from '../customer/customer.service';
import { ProviderRepository } from '../provider/provider.repository';
import { SupportRepository } from '../support/support.repository';
import { AuthService } from './auth.service';

describe('AuthService account deactivation', () => {
  let authService: AuthService;
  let customers: CustomerRepository;
  let customerService: CustomerService;
  let providers: ProviderRepository;
  let support: SupportRepository;

  beforeEach(() => {
    customers = new CustomerRepository();
    customerService = new CustomerService(customers);
    providers = new ProviderRepository();
    support = new SupportRepository();
    authService = new AuthService(customers, providers, support);
  });

  it('rejects inactive customers and issues a new version after reactivation', () => {
    const activeLogin = authService.login({
      email: 'rahul@gmail.com',
      password: 'Rahul@123',
    });
    expect(activeLogin.data).toMatchObject({
      id: 'C001',
      role: 'CUSTOMER',
      sessionVersion: 0,
    });
    expect(activeLogin.data).not.toHaveProperty('accessToken');
    expect(activeLogin.data).not.toHaveProperty('refreshToken');

    customerService.updateStatus('C001', 'INACTIVE');
    expect(() =>
      authService.login({
        email: 'rahul@gmail.com',
        password: 'Rahul@123',
      }),
    ).toThrow(
      'Your account has been deactivated by the administrator. You cannot log in. Please contact customer support for assistance.',
    );

    customerService.updateStatus('C001', 'ACTIVE');
    const reactivatedLogin = authService.login({
      email: 'rahul@gmail.com',
      password: 'Rahul@123',
    });
    expect(reactivatedLogin.data.sessionVersion).toBe(1);
  });

  it('blocks and re-allows a provider according to the current account status', () => {
    expect(
      authService.login({ email: 'apsrtc@gmail.com', password: 'Apsrtc@123' })
        .data,
    ).toMatchObject({
      id: 'P001',
      role: 'PROVIDER',
    });

    providers.update('P001', { status: 'INACTIVE' });
    expect(() =>
      authService.login({ email: 'apsrtc@gmail.com', password: 'Apsrtc@123' }),
    ).toThrow(
      'Your service provider account has been deactivated by the administrator. You cannot log in. Please contact customer support for assistance.',
    );

    providers.update('P001', { status: 'ACTIVE' });
    const login = authService.login({
      email: 'apsrtc@gmail.com',
      password: 'Apsrtc@123',
    });
    expect(login.data.role).toBe('PROVIDER');
    expect(login.data).not.toHaveProperty('accessToken');
    expect(login.data).not.toHaveProperty('refreshToken');
  });

  it('blocks and re-allows a support employee according to the current account status', () => {
    expect(
      authService.login({
        email: 'support@click2book.com',
        password: 'Support@123',
      }).data,
    ).toMatchObject({
      id: 'SUPPORT001',
      role: 'SUPPORT',
    });

    support.update('SUPPORT001', { status: 'INACTIVE' });
    expect(() =>
      authService.login({
        email: 'support@click2book.com',
        password: 'Support@123',
      }),
    ).toThrow(
      'Your customer support account has been deactivated by the administrator. You cannot log in. Please contact your administrator for assistance.',
    );

    support.update('SUPPORT001', { status: 'ACTIVE' });
    const login = authService.login({
      email: 'SUPPORT001',
      password: 'Support@123',
    });
    expect(login.data.role).toBe('SUPPORT');
    expect(login.data).not.toHaveProperty('accessToken');
    expect(login.data).not.toHaveProperty('refreshToken');
  });
});
