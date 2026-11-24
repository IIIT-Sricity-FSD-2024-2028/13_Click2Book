import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
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
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Create discount offer (Provider/Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  create(@Body() dto: CreateOfferDto) { return this.offerService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all offers (public)' })
  findAll() { return this.offerService.findAll(); }

  @Get('active')
  @ApiOperation({ summary: 'Offers usable today: ACTIVE and within their dates (public)' })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  findActive(@Query('providerId') providerId?: string) { return this.offerService.findActive(providerId); }

  @Get('validate')
  @ApiOperation({ summary: 'Check an offer code against everything known about a booking; returns the discount or the reason it cannot be used (public)' })
  @ApiQuery({ name: 'code', required: true, example: 'SUMMER20' })
  @ApiQuery({ name: 'fare', required: true, example: 1200 })
  @ApiQuery({ name: 'providerId', required: false, example: 'P001' })
  @ApiQuery({ name: 'tripId', required: false, example: 'T001' })
  @ApiQuery({ name: 'customerId', required: false, example: 'C001' })
  @ApiQuery({ name: 'seats', required: false, example: 2 })
  @ApiQuery({ name: 'journeyDate', required: false, example: '2026-12-01' })
  @ApiQuery({ name: 'paymentMethod', required: false, example: 'UPI' })
  validate(
    @Query('code') code: string,
    @Query('fare') fare: string,
    @Query('providerId') providerId?: string,
    @Query('tripId') tripId?: string,
    @Query('customerId') customerId?: string,
    @Query('seats') seats?: string,
    @Query('journeyDate') journeyDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    return this.offerService.validate(code, {
      fare: Number(fare) || 0,
      providerId,
      tripId,
      customerId,
      seats: seats ? Number(seats) : undefined,
      journeyDate,
      paymentMethod,
    });
  }

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
