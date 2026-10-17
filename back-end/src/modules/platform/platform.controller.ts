import { Body, Controller, Get, Headers, Put, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { successResponse } from '../../common/utils/response.util';
import { PlatformService } from './platform.service';

@ApiTags('Platform')
@UseGuards(RolesGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Platform settings (public — every portal reads fees, refund rules, banner)' })
  get() {
    return successResponse('Platform settings', this.platformService.get());
  }

  @Put('settings')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update platform settings (partial — sections are merged)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  update(@Body() body: Record<string, any>, @Headers('x-admin-email') adminEmail?: string) {
    return successResponse('Settings saved', this.platformService.update(body, adminEmail || 'Super Admin'));
  }
}
