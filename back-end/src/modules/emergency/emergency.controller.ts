import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { CreateEmergencyAlertDto } from './dto/emergency.dto';
import { EmergencyStatus } from './enums/emergency-status.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Emergency')
@UseGuards(RolesGuard)
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Raise an SOS alert on a confirmed, in-progress trip (Customer)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  create(@Body() dto: CreateEmergencyAlertDto) { return this.emergencyService.create(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all emergency alerts (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: EmergencyStatus })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll(@Query('status') status?: EmergencyStatus) { return this.emergencyService.findAll(status); }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get emergency alert by ID (Admin)' })
  @ApiParam({ name: 'id', example: 'EMG001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findOne(@Param('id') id: string) { return this.emergencyService.findById(id); }

  @Patch(':id/acknowledge')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Acknowledge an open alert (Admin)' })
  @ApiParam({ name: 'id', example: 'EMG001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  acknowledge(@Param('id') id: string) { return this.emergencyService.acknowledge(id); }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Resolve an alert (Admin)' })
  @ApiParam({ name: 'id', example: 'EMG001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  resolve(@Param('id') id: string) { return this.emergencyService.resolve(id); }
}
