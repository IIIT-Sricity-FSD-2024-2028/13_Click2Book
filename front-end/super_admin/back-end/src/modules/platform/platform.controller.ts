import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const ROLE_HEADER = {
  name: 'x-role',
  required: true,
  schema: { example: 'ADMIN' },
};

@ApiTags('Platform (Super Admin)')
@UseGuards(RolesGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  /** Public: every portal reads the policies, fees and announcement. */
  @Get('settings')
  @ApiOperation({ summary: 'Current platform settings (public)' })
  getSettings() {
    return this.platform.getSettings();
  }

  @Put('settings')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Update platform settings — partial object, validated (Admin only)',
  })
  @ApiHeader(ROLE_HEADER)
  update(
    @Body() body: Record<string, unknown>,
    @Headers('x-admin-email') actor?: string,
  ) {
    return this.platform.updateSettings(body, actor || 'admin');
  }

  @Post('settings/reset')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reset platform settings to defaults (Admin only)' })
  @ApiHeader(ROLE_HEADER)
  reset(@Headers('x-admin-email') actor?: string) {
    return this.platform.resetSettings(actor || 'admin');
  }

  @Get('activity')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Recent admin actions (every non-GET request made with x-role: ADMIN)',
  })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiHeader(ROLE_HEADER)
  activity(@Query('limit') limit?: string) {
    return this.platform.getActivity(
      Math.min(500, Math.max(1, Number(limit) || 200)),
    );
  }
}
