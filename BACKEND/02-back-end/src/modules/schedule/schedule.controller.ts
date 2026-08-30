import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Schedules')
@UseGuards(RolesGuard)
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Create a new schedule (Provider only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  create(@Body() dto: CreateScheduleDto) { return this.scheduleService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all schedules (filter by providerId or date)' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-01' })
  findAll(@Query('providerId') providerId?: string, @Query('date') date?: string) {
    return this.scheduleService.findAll(providerId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', example: 'SCH001' })
  findOne(@Param('id') id: string) { return this.scheduleService.findById(id); }

  @Put(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update schedule (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'SCH001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete schedule (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'SCH001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  remove(@Param('id') id: string) { return this.scheduleService.remove(id); }
}
