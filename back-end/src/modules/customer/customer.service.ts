import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepo: CustomerRepository) {}

  create(dto: CreateCustomerDto) {
    if (this.customerRepo.findByEmail(dto.email))
      throw new ConflictException('Email already registered');
    if (this.customerRepo.findByPhone(dto.phoneNumber))
      throw new ConflictException('Phone number already registered');
    const customer = this.customerRepo.create(dto);
    return successResponse('Customer registered successfully', customer);
  }

  findAll() {
    return successResponse('All customers retrieved', this.customerRepo.findAll());
  }

  findById(id: string) {
    const customer = this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return successResponse('Customer retrieved', customer);
  }

  update(id: string, dto: UpdateCustomerDto) {
    const customer = this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    const updated = this.customerRepo.update(id, dto);
    return successResponse('Customer updated successfully', updated);
  }

  remove(id: string) {
    const exists = this.customerRepo.findById(id);
    if (!exists) throw new NotFoundException(`Customer ${id} not found`);
    this.customerRepo.remove(id);
    return successResponse('Customer deleted successfully');
  }

  /** Phase 5B — store the uploaded profile picture URL path on the customer record */
  uploadProfilePicture(id: string, filename: string) {
    const customer = this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    const picturePath = `/uploads/profile/${filename}`;
    this.customerRepo.update(id, { profilePicture: picturePath });
    return successResponse('Profile picture uploaded successfully', {
      customerId: id,
      profilePicture: picturePath,
    });
  }
}
