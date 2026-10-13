import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const ROLE_HEADER = {
  name: 'x-role',
  required: true,
  schema: { example: 'ADMIN' },
};

@ApiTags('Admin')
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create admin account with a role and permissions (Admin only)',
  })
  @ApiHeader(ROLE_HEADER)
  create(@Body() dto: CreateAdminDto) {
    return this.adminService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all admins (Admin only)' })
  @ApiHeader(ROLE_HEADER)
  findAll() {
    return this.adminService.findAll();
  }

  @Get('dashboard')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin analytics dashboard' })
  @ApiHeader(ROLE_HEADER)
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiParam({ name: 'id', example: 'A001' })
  @ApiHeader(ROLE_HEADER)
  findOne(@Param('id') id: string) {
    return this.adminService.findById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Edit admin — name, email, password, role, permissions, status',
  })
  @ApiParam({ name: 'id', example: 'A002' })
  @ApiHeader(ROLE_HEADER)
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate an admin (they can no longer log in)' })
  @ApiParam({ name: 'id', example: 'A002' })
  @ApiHeader(ROLE_HEADER)
  deactivate(@Param('id') id: string) {
    return this.adminService.setStatus(id, 'INACTIVE');
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Re-activate an admin' })
  @ApiParam({ name: 'id', example: 'A002' })
  @ApiHeader(ROLE_HEADER)
  activate(@Param('id') id: string) {
    return this.adminService.setStatus(id, 'ACTIVE');
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an admin account' })
  @ApiParam({ name: 'id', example: 'A002' })
  @ApiHeader(ROLE_HEADER)
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }
}
