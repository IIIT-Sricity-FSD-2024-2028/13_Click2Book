import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { IrctcService } from './irctc.service';
import { CreateIrctcDto, UpdateIrctcStatusDto } from './dto/irctc.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('IRCTC')
@UseGuards(RolesGuard)
@Controller('irctc')
export class IrctcController {
  constructor(private readonly irctcService: IrctcService) {}

  @Post('verify')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Initiate IRCTC verification for train booking (Customer)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  verify(@Body() dto: CreateIrctcDto) { return this.irctcService.verify(dto); }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all IRCTC verifications (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() { return this.irctcService.findAll(); }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get IRCTC verification status by ID' })
  @ApiParam({ name: 'id', example: 'IRCTC001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findOne(@Param('id') id: string) { return this.irctcService.findById(id); }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update IRCTC verification status (Admin)' })
  @ApiParam({ name: 'id', example: 'IRCTC001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateIrctcStatusDto) {
    return this.irctcService.updateStatus(id, dto);
  }
}
