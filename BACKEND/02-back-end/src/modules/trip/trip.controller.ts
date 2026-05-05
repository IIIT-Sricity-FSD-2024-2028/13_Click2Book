import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { TripService } from './trip.service';
import { CreateTripDto, UpdateTripStatusDto } from './dto/trip.dto';
import { TripStatus } from './enums/trip-status.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Trips')
@UseGuards(RolesGuard)
@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Create a trip — assign vehicle to schedule (Provider)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  create(@Body() dto: CreateTripDto) { return this.tripService.create(dto); }

  @Get('search')
  @ApiOperation({ summary: 'Search trips — dedicated search endpoint' })
  @ApiQuery({ name: 'source', required: true,  example: 'Mumbai' })
  @ApiQuery({ name: 'destination', required: true, example: 'Pune' })
  @ApiQuery({ name: 'date', required: false,   example: '2026-06-01' })
  search(
    @Query('source') source: string,
    @Query('destination') destination: string,
    @Query('date') date?: string,
  ) {
    return this.tripService.search(source, destination, date || '');
  }

  @Get()
  @ApiOperation({ summary: 'Get all trips OR search by source/destination/date' })
  @ApiQuery({ name: 'source', required: false, example: 'Hyderabad' })
  @ApiQuery({ name: 'destination', required: false, example: 'Chennai' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-01' })
  @ApiQuery({ name: 'status', required: false, enum: TripStatus })
  findAll(
    @Query('source') source?: string,
    @Query('destination') destination?: string,
    @Query('date') date?: string,
    @Query('status') status?: TripStatus,
  ) {
    if (source && destination) return this.tripService.search(source, destination, date || '');
    return this.tripService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full trip details (trip + schedule + vehicle)' })
  @ApiParam({ name: 'id', example: 'T001' })
  findOne(@Param('id') id: string) { return this.tripService.findById(id); }

  @Patch(':id/status')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update trip status (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'T001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTripStatusDto) {
    return this.tripService.updateStatus(id, dto);
  }

  @Patch(':id/confirm')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Confirm a trip (Provider)' })
  @ApiParam({ name: 'id', example: 'T001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  confirm(@Param('id') id: string) { return this.tripService.confirm(id); }
}
