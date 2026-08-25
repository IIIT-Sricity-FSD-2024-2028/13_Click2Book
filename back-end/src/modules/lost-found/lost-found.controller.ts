import { Controller, Get, Post, Patch, Body, Param, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { LostFoundService } from './lost-found.service';
import { CreateLostFoundItemDto, UpdateLostFoundStatusDto } from './dto/lost-found.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Lost & Found')
@UseGuards(RolesGuard)
@Controller('lost-found')
export class LostFoundController {
  constructor(private readonly lostFoundService: LostFoundService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Report a lost item on a past/current trip (Customer)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  create(@Body() dto: CreateLostFoundItemDto) { return this.lostFoundService.create(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all lost & found reports (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() { return this.lostFoundService.findAll(); }

  @Get('provider/:id')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Get reports for trips run by this provider (Provider)' })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  findByProvider(@Param('id') providerId: string) { return this.lostFoundService.findByProvider(providerId); }

  @Get('customer/:id')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get reports raised by a customer' })
  @ApiParam({ name: 'id', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findByCustomer(@Param('id') customerId: string) { return this.lostFoundService.findByCustomer(customerId); }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get a lost & found report by ID (Customer must own it)' })
  @ApiParam({ name: 'id', example: 'LF001' })
  @ApiQuery({ name: 'customerId', required: false, example: 'C001', description: 'Required when calling as CUSTOMER' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findOne(@Param('id') id: string, @Headers('x-role') role?: string, @Query('customerId') customerId?: string) {
    return this.lostFoundService.findById(id, role, customerId);
  }

  @Patch(':id/status')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update report status — FOUND/RETURNED/CLOSED (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'LF001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLostFoundStatusDto) {
    return this.lostFoundService.updateStatus(id, dto);
  }
}
