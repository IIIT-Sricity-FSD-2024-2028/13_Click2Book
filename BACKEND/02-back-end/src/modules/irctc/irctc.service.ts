import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IrctcRepository } from './irctc.repository';
import { CreateIrctcDto, UpdateIrctcStatusDto } from './dto/irctc.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class IrctcService {
  constructor(private readonly irctcRepo: IrctcRepository) {}

  verify(dto: CreateIrctcDto) {
    if (this.irctcRepo.findByUsername(dto.irctcUsername))
      throw new ConflictException(`IRCTC username ${dto.irctcUsername} already submitted`);
    const record = this.irctcRepo.create(dto);
    return successResponse('IRCTC verification initiated. Status: IN_PROGRESS.', record);
  }

  findAll() { return successResponse('All IRCTC records', this.irctcRepo.findAll()); }

  findById(id: string) {
    const r = this.irctcRepo.findById(id);
    if (!r) throw new NotFoundException(`IRCTC record ${id} not found`);
    return successResponse('IRCTC record', r);
  }

  updateStatus(id: string, dto: UpdateIrctcStatusDto) {
    if (!this.irctcRepo.findById(id)) throw new NotFoundException(`IRCTC record ${id} not found`);
    return successResponse('IRCTC status updated', this.irctcRepo.update(id, dto));
  }
}
