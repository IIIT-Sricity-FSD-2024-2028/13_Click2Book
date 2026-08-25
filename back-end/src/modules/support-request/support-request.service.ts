import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportRequestRepository } from './support-request.repository';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './dto/support-request.dto';
import { SupportStatus } from './enums/support-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class SupportRequestService {
  constructor(private readonly repo: SupportRequestRepository) {}

  create(dto: CreateSupportRequestDto) {
    return successResponse('Support request raised', this.repo.create(dto));
  }

  findAll(status?: SupportStatus) {
    if (status) return successResponse('Requests by status', this.repo.findByStatus(status));
    return successResponse('All support requests', this.repo.findAll());
  }

  findById(id: string) {
    const r = this.repo.findById(id);
    if (!r) throw new NotFoundException(`Support request ${id} not found`);
    return successResponse('Support request', r);
  }

  findByCustomer(cid: string) { return successResponse('Customer requests', this.repo.findByCustomer(cid)); }
  findBySupporter(sid: string) { return successResponse('Assigned tickets', this.repo.findBySupporter(sid)); }

  update(id: string, dto: UpdateSupportRequestDto) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Support request ${id} not found`);
    return successResponse('Support request updated', this.repo.update(id, dto));
  }
}
