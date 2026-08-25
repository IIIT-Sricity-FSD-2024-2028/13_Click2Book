import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { CancellationService } from './cancellation.service';
import { CreateCancellationDto } from './dto/cancellation.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Cancellations')
@UseGuards(RolesGuard)
@Controller('cancellations')
export class CancellationController {
  constructor(private readonly cancellationService: CancellationService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel a confirmed booking (Customer/Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  cancel(@Body() dto: CreateCancellationDto) { return this.cancellationService.cancel(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all cancellations (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() { return this.cancellationService.findAll(); }

  @Get('booking/:bookingId')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get cancellation record for a booking' })
  @ApiParam({ name: 'bookingId', example: 'B001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.cancellationService.findByBooking(bookingId);
  }
}
