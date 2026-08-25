import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './dto/support-request.dto';
import { SupportStatus } from './enums/support-status.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Support Requests')
@UseGuards(RolesGuard)
@Controller('support-requests')
export class SupportRequestController {
  constructor(private readonly service: SupportRequestService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Raise a support request (Customer)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  create(@Body() dto: CreateSupportRequestDto) { return this.service.create(dto); }

  @Get()
  @Roles(Role.SUPPORT, Role.ADMIN)
  @ApiOperation({ summary: 'Get all support requests (Support/Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: SupportStatus })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  findAll(@Query('status') status?: SupportStatus) { return this.service.findAll(status); }

  @Get('customer/:customerId')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get requests raised by a customer' })
  @ApiParam({ name: 'customerId', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findByCustomer(@Param('customerId') cid: string) { return this.service.findByCustomer(cid); }

  @Get(':id')
  @Roles(Role.SUPPORT, Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get support request by ID' })
  @ApiParam({ name: 'id', example: 'SR001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Patch(':id')
  @Roles(Role.SUPPORT, Role.ADMIN)
  @ApiOperation({ summary: 'Update support request — assign agent, change status (Support/Admin)' })
  @ApiParam({ name: 'id', example: 'SR001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'SUPPORT' } })
  update(@Param('id') id: string, @Body() dto: UpdateSupportRequestDto) {
    return this.service.update(id, dto);
  }
}
