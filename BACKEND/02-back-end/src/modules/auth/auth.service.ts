import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomerRepository } from '../customer/customer.repository';
import { LoginDto } from './dto/auth.dto';
import { successResponse } from '../../common/utils/response.util';

/** Predefined non-customer users */
const STATIC_USERS = [
  { email: 'admin@click2book.com',   password: 'Admin@123',   role: 'ADMIN',    name: 'Admin',         id: 'ADMIN001'  },
  { email: 'apsrtc@gmail.com',       password: 'Apsrtc@123',  role: 'PROVIDER', name: 'APSRTC',        id: 'P001'      },
  { email: 'ksrtc@gmail.com',        password: 'Ksrtc@123',   role: 'PROVIDER', name: 'KSRTC',         id: 'P002'      },
  { email: 'support@click2book.com', password: 'Support@123', role: 'SUPPORT',  name: 'Support Agent', id: 'SUPPORT001'},
];

@Injectable()
export class AuthService {
  constructor(private readonly customerRepo: CustomerRepository) {}

  login(dto: LoginDto) {
    // 1. Check static users (admin / provider / support)
    const staticUser = STATIC_USERS.find(
      u => u.email === dto.email && u.password === dto.password,
    );
    if (staticUser) {
      return successResponse('Login successful', {
        id:    staticUser.id,
        name:  staticUser.name,
        email: staticUser.email,
        role:  staticUser.role,
      });
    }

    // 2. Check customer repository (supports dynamically registered customers too)
    const customer = this.customerRepo.findByEmail(dto.email);
    if (customer && customer.password === dto.password) {
      return successResponse('Login successful', {
        id:    customer.customerId,
        name:  customer.name,
        email: customer.email,
        role:  'CUSTOMER',
      });
    }

    throw new UnauthorizedException('Invalid email or password');
  }

  /** Return all predefined users — useful for Swagger testing */
  listTestUsers() {
    const customers = this.customerRepo.findAll().map(c => ({
      email: c.email, password: c.password, role: 'CUSTOMER', name: c.name,
    }));
    const statics = STATIC_USERS.map(u => ({
      email: u.email, password: u.password, role: u.role, name: u.name,
    }));
    return successResponse('Test credentials', [...statics, ...customers]);
  }
}
