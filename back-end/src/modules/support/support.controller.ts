import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportStaffDto } from './dto/support-staff.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Support Staff')
@UseGuards(RolesGuard)
@Controller('support-staff')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add support staff (Admin only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  create(@Body() dto: CreateSupportStaffDto) { return this.supportService.create(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all support staff (Admin only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() { return this.supportService.findAll(); }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPPORT)
  @ApiOperation({ summary: 'Get support staff by ID' })
  @ApiParam({ name: 'id', example: 'SUP001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findOne(@Param('id') id: string) { return this.supportService.findById(id); }
}
