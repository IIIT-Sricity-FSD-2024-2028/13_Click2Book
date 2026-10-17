import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { RefundService } from './refund.service';
import { CreateRefundDto, ProcessRefundDto } from './dto/refund.dto';
import { RefundStatus } from './enums/refund-status.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Refunds')
@UseGuards(RolesGuard)
@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post('request')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Request a refund after cancellation (Customer)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  request(@Body() dto: CreateRefundDto) { return this.refundService.request(dto); }

  @Get()
  @Roles(Role.ADMIN, Role.SUPPORT)
  @ApiOperation({ summary: 'Get all refunds (Admin/Support)' })
  @ApiQuery({ name: 'status', required: false, enum: RefundStatus })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  findAll(@Query('status') status?: RefundStatus) { return this.refundService.findAll(status); }

  @Get('booking/:bookingId')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPPORT)
  @ApiOperation({ summary: 'Get refund for a specific booking' })
  @ApiParam({ name: 'bookingId', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.refundService.findByBooking(bookingId);
  }

  @Patch('booking/:bookingId/process')
  @Roles(Role.ADMIN, Role.SUPPORT)
  @ApiOperation({ summary: 'Process a refund — Admin/Support' })
  @ApiParam({ name: 'bookingId', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  process(@Param('bookingId') bookingId: string, @Body() dto: ProcessRefundDto) {
    return this.refundService.process(bookingId, dto);
  }
}
