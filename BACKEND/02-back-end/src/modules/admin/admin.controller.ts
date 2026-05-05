import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/admin.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Admin')
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create admin account (Admin only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  create(@Body() dto: CreateAdminDto) { return this.adminService.create(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all admins (Admin only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() { return this.adminService.findAll(); }

  @Get('dashboard')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin analytics dashboard' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  getDashboard() { return this.adminService.getDashboard(); }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiParam({ name: 'id', example: 'A001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findOne(@Param('id') id: string) { return this.adminService.findById(id); }
}
