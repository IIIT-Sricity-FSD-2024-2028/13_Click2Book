import { Injectable, NotFoundException } from '@nestjs/common';
import { ScheduleRepository } from './schedule.repository';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepo: ScheduleRepository) {}

  create(dto: CreateScheduleDto) {
    return successResponse('Schedule created', this.scheduleRepo.create(dto));
  }

  findAll(providerId?: string, date?: string) {
    if (providerId) return successResponse('Provider schedules', this.scheduleRepo.findByProvider(providerId));
    if (date) return successResponse('Schedules for date', this.scheduleRepo.findByDate(date));
    return successResponse('All schedules', this.scheduleRepo.findAll());
  }

  findById(id: string) {
    const s = this.scheduleRepo.findById(id);
    if (!s) throw new NotFoundException(`Schedule ${id} not found`);
    return successResponse('Schedule retrieved', s);
  }

  update(id: string, dto: UpdateScheduleDto) {
    if (!this.scheduleRepo.findById(id)) throw new NotFoundException(`Schedule ${id} not found`);
    return successResponse('Schedule updated', this.scheduleRepo.update(id, dto));
  }

  remove(id: string) {
    if (!this.scheduleRepo.findById(id)) throw new NotFoundException(`Schedule ${id} not found`);
    this.scheduleRepo.remove(id);
    return successResponse('Schedule deleted');
  }
}
