import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { OfferService } from './offer.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Offers')
@UseGuards(RolesGuard)
@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Create discount offer (Provider)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  create(@Body() dto: CreateOfferDto) { return this.offerService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all offers (public)' })
  findAll() { return this.offerService.findAll(); }

  @Get('active')
  @ApiOperation({ summary: 'Get only active offers (public)' })
  findActive() { return this.offerService.findActive(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by ID' })
  @ApiParam({ name: 'id', example: 'O001' })
  findOne(@Param('id') id: string) { return this.offerService.findById(id); }

  @Put(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update offer status (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'O001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete offer (Admin)' })
  @ApiParam({ name: 'id', example: 'O001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) { return this.offerService.remove(id); }
}
