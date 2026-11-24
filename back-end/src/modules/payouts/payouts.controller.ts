import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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

  @Post(':providerId/transfer')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Transfer everything a provider is owed and mark those bookings as paid out (Admin)" })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  transfer(@Param('providerId') providerId: string) {
    return this.payoutsService.transfer(providerId);
  }

  @Get('transfers')
  @Roles(Role.ADMIN, Role.PROVIDER)
  @ApiOperation({ summary: 'Payout transfer history, newest first (Admin/Provider)' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  transfers(@Query('providerId') providerId?: string) {
    return this.payoutsService.listTransfers(providerId);
  }
}
