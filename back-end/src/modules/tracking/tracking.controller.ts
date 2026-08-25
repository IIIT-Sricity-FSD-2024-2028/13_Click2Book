import { Controller, Get, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/tracking.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Tracking')
@UseGuards(RolesGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Patch(':tripId')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Update live location for an in-progress trip (Provider, must operate the trip)' })
  @ApiParam({ name: 'tripId', example: 'T001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  update(@Param('tripId') tripId: string, @Body() dto: UpdateLocationDto) {
    return this.trackingService.updateLocation(tripId, dto);
  }

  @Get(':tripId/eta')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Estimated arrival for a trip (Customer)' })
  @ApiParam({ name: 'tripId', example: 'T001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  eta(@Param('tripId') tripId: string) {
    return this.trackingService.getEta(tripId);
  }

  @Get(':tripId')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.PROVIDER)
  @ApiOperation({ summary: 'Get current location for a trip (Customer must hold a booking on it)' })
  @ApiParam({ name: 'tripId', example: 'T001' })
  @ApiQuery({ name: 'customerId', required: false, example: 'C001', description: 'Required when calling as CUSTOMER' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  get(
    @Param('tripId') tripId: string,
    @Headers('x-role') role?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.trackingService.getLocation(tripId, role, customerId);
  }
}
