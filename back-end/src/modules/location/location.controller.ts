import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import {
  CreateLocationRequestDto,
  RejectLocationRequestDto,
  DirectCreateLocationDto,
} from './dto/location.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Locations')
@UseGuards(RolesGuard)
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all approved locations in the network' })
  @ApiQuery({ name: 'search', required: false, example: 'Hyderabad' })
  getApprovedLocations(@Query('search') search?: string) {
    return this.locationService.getApprovedLocations(search);
  }

  @Get('osm-search')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({
    summary:
      'Search OpenStreetMap Nominatim for cities, towns, and bus stops (rate-limited and cached)',
  })
  @ApiQuery({ name: 'query', required: true, example: 'Warangal' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  searchOsm(@Query('query') query: string) {
    return this.locationService.searchOsmNominatim(query);
  }

  @Get('requests')
  @Roles(Role.ADMIN, Role.PROVIDER)
  @ApiOperation({
    summary: 'Get all location requests (filtered by status or provider)',
  })
  @ApiQuery({ name: 'status', required: false, example: 'PENDING' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  getLocationRequests(
    @Query('status') status?: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.locationService.getLocationRequests(status, providerId);
  }

  @Get('requests/:id')
  @Roles(Role.ADMIN, Role.PROVIDER)
  @ApiOperation({ summary: 'Get location request details by ID' })
  @ApiParam({ name: 'id', example: 'REQ001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  getLocationRequestById(@Param('id') id: string) {
    return this.locationService.getLocationRequestById(id);
  }

  @Post('requests')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({
    summary: 'Submit a new location request with validated OSM data',
  })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  createLocationRequest(
    @Body() dto: CreateLocationRequestDto,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-name') userName?: string,
  ) {
    return this.locationService.createLocationRequest(dto, userId, userName);
  }

  @Patch('requests/:id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Approve a location request and add it to active network (Admin)',
  })
  @ApiParam({ name: 'id', example: 'REQ001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  approveLocationRequest(
    @Param('id') id: string,
    @Headers('x-user-id') adminId?: string,
  ) {
    return this.locationService.approveLocationRequest(id, adminId);
  }

  @Patch('requests/:id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject a location request with reason (Admin)' })
  @ApiParam({ name: 'id', example: 'REQ001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  rejectLocationRequest(
    @Param('id') id: string,
    @Body() dto: RejectLocationRequestDto,
    @Headers('x-user-id') adminId?: string,
  ) {
    return this.locationService.rejectLocationRequest(id, dto, adminId);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Directly add an approved location to the database (Admin)',
  })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  directCreateLocation(@Body() dto: DirectCreateLocationDto) {
    return this.locationService.directCreateLocation(dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete a location from the active network (Admin)',
  })
  @ApiParam({ name: 'id', example: 'LOC001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  deleteLocation(@Param('id') id: string) {
    return this.locationService.deleteLocation(id);
  }
}
