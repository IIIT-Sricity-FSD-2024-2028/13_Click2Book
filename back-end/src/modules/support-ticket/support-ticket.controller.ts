import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/support-ticket.dto';
import { TicketCategory } from './enums/ticket-category.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Support Tickets')
@UseGuards(RolesGuard)
@Controller('support-ticket')
export class SupportTicketController {
  constructor(private readonly service: SupportTicketService) {}

  @Post()
  @Roles(Role.SUPPORT, Role.ADMIN)
  @ApiOperation({ summary: 'Manually create a support ticket that draws a cost against a booking\'s ledger (Support/Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  create(@Body() dto: CreateSupportTicketDto) {
    return this.service.create(dto);
  }

  // Declared before ':bookingId' so it is never swallowed as a bookingId param.
  @Get()
  @Roles(Role.SUPPORT, Role.ADMIN)
  @ApiOperation({ summary: 'List all support tickets, optionally filtered by status/category (Support/Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'resolved'] })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  findAll(
    @Query('status') status?: 'open' | 'resolved',
    @Query('category') category?: TicketCategory,
  ) {
    return this.service.findAll(status, category);
  }

  @Patch(':ticketId/resolve')
  @Roles(Role.SUPPORT, Role.ADMIN)
  @ApiOperation({ summary: 'Mark a support ticket resolved (Support/Admin)' })
  @ApiParam({ name: 'ticketId', example: 'TCK001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  resolve(@Param('ticketId') ticketId: string) {
    return this.service.resolve(ticketId);
  }

  @Get(':bookingId')
  @Roles(Role.SUPPORT, Role.ADMIN)
  @ApiOperation({ summary: 'List support tickets raised for a booking (Support/Admin)' })
  @ApiParam({ name: 'bookingId', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.service.findByBooking(bookingId);
  }
}
