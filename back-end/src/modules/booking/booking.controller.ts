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

  @Post('historical')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Register a historical or legacy booking' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  registerHistorical(@Body() body: any) {
    return this.bookingService.registerHistorical(body);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROVIDER)
  @ApiOperation({ summary: 'Get all bookings (Admin or Provider)' })
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

  @Get('trip/:tripId')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Get active bookings for a trip (Provider)' })
  @ApiParam({ name: 'tripId', example: 'T001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  findByTrip(@Param('tripId') tripId: string) {
    return this.bookingService.findByTrip(tripId);
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
