import {
  Body, Controller, Get, HttpCode, Post, UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RevenueSplitService } from './revenue-split.service';
import { UpdateRevenueSplitConfigDto } from './dto/revenue-split-config.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Revenue Split Config')
@UseGuards(RolesGuard)
@Controller('admin/revenue-config')
export class RevenueSplitController {
  constructor(private readonly service: RevenueSplitService) {}

  @Post()
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update revenue split configuration — never hard-blocks, may return a warning (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  update(@Body() dto: UpdateRevenueSplitConfigDto) {
    return this.service.updateConfig(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get current revenue split configuration (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  get() {
    return this.service.getConfig();
  }
}
