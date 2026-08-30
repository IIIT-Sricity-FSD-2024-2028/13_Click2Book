import {
  Controller, Get, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Ledger')
@UseGuards(RolesGuard)
@Controller('admin/ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  // Declared before ':bookingId' so 'summary'/'' are never swallowed as a bookingId param.
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all transaction ledger rows, optionally filtered by status (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ['clean', 'cancelled', 'disputed'] })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll(@Query('status') status?: 'clean' | 'cancelled' | 'disputed') {
    return this.ledgerService.findAll(status);
  }

  @Get('summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get ledger totals for a createdAt date range (Admin)' })
  @ApiQuery({ name: 'from', required: false, example: '2026-06-01T00:00:00.000Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-06-30T23:59:59.999Z' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.ledgerService.getSummary(from, to);
  }

  @Get(':bookingId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get the transaction ledger row for a booking (Admin)' })
  @ApiParam({ name: 'bookingId', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  getByBooking(@Param('bookingId') bookingId: string) {
    return this.ledgerService.getByBooking(bookingId);
  }
}
