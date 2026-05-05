import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { SeatService } from './seat.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Seats')
@UseGuards(RolesGuard)
@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get all seats for a vehicle' })
  @ApiParam({ name: 'vehicleId', example: 'V001' })
  getByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.seatService.getByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/available')
  @ApiOperation({ summary: 'Get available seats for a vehicle' })
  @ApiParam({ name: 'vehicleId', example: 'V001' })
  getAvailable(@Param('vehicleId') vehicleId: string) {
    return this.seatService.getAvailableByVehicle(vehicleId);
  }

  @Patch('vehicle/:vehicleId/seat/:seatNumber/block')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Block a seat (Provider/Admin)' })
  @ApiParam({ name: 'vehicleId', example: 'V001' })
  @ApiParam({ name: 'seatNumber', example: '5' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  block(@Param('vehicleId') vehicleId: string, @Param('seatNumber') seatNumber: string) {
    return this.seatService.blockSeat(vehicleId, +seatNumber);
  }

  @Patch('vehicle/:vehicleId/seat/:seatNumber/release')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Release a seat (Provider/Admin)' })
  @ApiParam({ name: 'vehicleId', example: 'V001' })
  @ApiParam({ name: 'seatNumber', example: '5' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  release(@Param('vehicleId') vehicleId: string, @Param('seatNumber') seatNumber: string) {
    return this.seatService.releaseSeat(vehicleId, +seatNumber);
  }
}
