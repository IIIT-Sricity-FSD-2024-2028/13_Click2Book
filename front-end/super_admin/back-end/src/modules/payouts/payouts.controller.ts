import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Payouts')
@UseGuards(RolesGuard)
@Controller('admin/payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('summary')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Payout totals grouped by provider, admin, or support agent — names resolved live, never hardcoded (Admin)',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-06-01T00:00:00.000Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-06-30T23:59:59.999Z' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['providerId', 'adminId', 'agentId'] })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  summary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.payoutsService.getSummary(groupBy, from, to);
  }
}
