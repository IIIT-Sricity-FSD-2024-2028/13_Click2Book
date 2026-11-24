import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  SaveSeatLayoutDto,
  AssignRouteDto,
  ChangeRouteDto,
  SaveRoundTripScheduleDto,
} from './dto/vehicle.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { BusStatus } from './interfaces/vehicle.interface';

@ApiTags('Vehicles / Bus Fleet Management')
@UseGuards(RolesGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Register a new bus (Provider only)' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Get('stats')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Get bus fleet overview statistics' })
  @ApiQuery({ name: 'providerId', required: false })
  getFleetStats(@Query('providerId') providerId?: string) {
    return this.vehicleService.getFleetStats(providerId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles / buses' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  findAll(@Query('providerId') providerId?: string) {
    if (providerId) return this.vehicleService.findByProvider(providerId);
    return this.vehicleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle / bus by ID' })
  @ApiParam({ name: 'id', example: 'V001' })
  findOne(@Param('id') id: string) {
    return this.vehicleService.findById(id);
  }

  @Put(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update vehicle details (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }

  @Put(':id/seat-layout')
  @Roles(Role.PROVIDER)
  @ApiOperation({
    summary: 'Save dynamic seat layout configuration for a registered bus',
  })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  saveSeatLayout(
    @Param('id') id: string,
    @Body() dto: SaveSeatLayoutDto,
    @Headers('x-provider-id') providerId?: string,
  ) {
    return this.vehicleService.saveSeatLayout(id, dto, providerId);
  }

  @Post(':id/assign-route')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Permanently assign a bus to a route corridor' })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  assignRoute(
    @Param('id') id: string,
    @Body() dto: AssignRouteDto,
    @Headers('x-provider-id') providerId?: string,
  ) {
    return this.vehicleService.assignRoute(id, dto, providerId);
  }

  @Get(':id/route-assignment')
  @ApiOperation({ summary: 'Get current route assignment for a bus' })
  @ApiParam({ name: 'id', example: 'V001' })
  async getRouteAssignment(@Param('id') id: string) {
    const res = await this.vehicleService.findById(id);
    return { success: true, data: res.data?.assignedRoute || null };
  }

  @Put(':id/change-route')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Change/reassign route for an existing bus' })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  changeRoute(
    @Param('id') id: string,
    @Body() dto: ChangeRouteDto,
    @Headers('x-provider-id') providerId?: string,
  ) {
    return this.vehicleService.changeRoute(id, dto, providerId);
  }

  @Post(':id/schedules')
  @Roles(Role.PROVIDER)
  @ApiOperation({
    summary:
      'Configure round-trip (UP and DOWN) schedules for permanently assigned bus',
  })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  saveSchedules(
    @Param('id') id: string,
    @Body() dto: SaveRoundTripScheduleDto,
    @Headers('x-provider-id') providerId?: string,
  ) {
    return this.vehicleService.saveRoundTripSchedules(id, dto, providerId);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Get round-trip schedules for a bus' })
  @ApiParam({ name: 'id', example: 'V001' })
  async getSchedules(@Param('id') id: string) {
    const res = await this.vehicleService.findById(id);
    return { success: true, data: res.data?.roundTripSchedule || null };
  }

  @Patch(':id/status')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({
    summary: 'Update bus operating status (Available, Maintenance, Inactive)',
  })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BusStatus,
    @Headers('x-provider-id') providerId?: string,
  ) {
    return this.vehicleService.updateStatus(id, status, providerId);
  }

  @Delete(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete vehicle (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(id);
  }

  @Delete()
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete all vehicles / clear fleet for provider' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  removeAll(@Query('providerId') providerId?: string) {
    return this.vehicleService.removeAll(providerId);
  }
}
