import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Vehicles')
@UseGuards(RolesGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Add a new vehicle (Provider only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  create(@Body() dto: CreateVehicleDto) { return this.vehicleService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  findAll(@Query('providerId') providerId?: string) {
    if (providerId) return this.vehicleService.findByProvider(providerId);
    return this.vehicleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiParam({ name: 'id', example: 'V001' })
  findOne(@Param('id') id: string) { return this.vehicleService.findById(id); }

  @Put(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update vehicle (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete vehicle (Admin only)' })
  @ApiParam({ name: 'id', example: 'V001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) { return this.vehicleService.remove(id); }
}
