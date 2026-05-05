import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Bookings')
@UseGuards(RolesGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new booking (Customer) — returns PENDING booking' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  create(@Body() dto: CreateBookingDto) { return this.bookingService.create(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll(@Query('status') status?: BookingStatus) {
    return this.bookingService.findAll(status);
  }

  @Get('customer/:customerId')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get all bookings for a customer' })
  @ApiParam({ name: 'customerId', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.bookingService.findByCustomer(customerId);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findOne(@Param('id') id: string) { return this.bookingService.findById(id); }

  @Patch(':id/confirm')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Confirm booking after payment (Customer/Admin)' })
  @ApiParam({ name: 'id', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  confirm(@Param('id') id: string) { return this.bookingService.confirm(id); }

  @Patch(':id/cancel')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel a confirmed booking (Customer/Admin)' })
  @ApiParam({ name: 'id', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  cancel(@Param('id') id: string) { return this.bookingService.cancel(id); }
}
