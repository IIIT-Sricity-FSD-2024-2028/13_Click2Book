import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import { CreateSupportStaffDto } from './dto/support-staff.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class SupportService {
  constructor(private readonly supportRepo: SupportRepository) {}

  create(dto: CreateSupportStaffDto) {
    if (this.supportRepo.findByEmail(dto.email))
      throw new ConflictException('Support staff email already exists');
    return successResponse('Support staff created', this.supportRepo.create(dto));
  }

  findAll() { return successResponse('All support staff', this.supportRepo.findAll()); }

  findById(id: string) {
    const s = this.supportRepo.findById(id);
    if (!s) throw new NotFoundException(`Support staff ${id} not found`);
    return successResponse('Support staff retrieved', s);
  }
}
