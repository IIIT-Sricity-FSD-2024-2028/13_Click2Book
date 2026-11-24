import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { OfferService } from './offer.service';
import {
  CreateOfferDto,
  UpdateOfferDto,
  ValidateOfferDto,
} from './dto/offer.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { successResponse } from '../../common/utils/response.util';

@ApiTags('Offers')
@UseGuards(RolesGuard)
@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Create discount offer (Provider/Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  create(@Body() dto: CreateOfferDto) {
    return this.offerService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROVIDER)
  @ApiOperation({ summary: 'Get all offers (Admin/Provider)' })
  findAll() {
    return this.offerService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get only active offers (public)' })
  findActive() {
    return this.offerService.findActive();
  }

  @Get('analytics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get coupon usage and financial analytics (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  analytics() {
    return this.offerService.analytics();
  }

  @Post('validate')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Validate a coupon for a customer' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'CUSTOMER' },
  })
  validate(@Body() dto: ValidateOfferDto) {
    return successResponse(
      'Coupon validated',
      this.offerService.validateAndApply(
        dto.offerCode,
        dto.fare,
        dto.customerId,
      ),
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROVIDER)
  @ApiOperation({ summary: 'Get offer by ID (Admin/Provider)' })
  @ApiParam({ name: 'id', example: 'O001' })
  findOne(@Param('id') id: string) {
    return this.offerService.findById(id);
  }

  @Put(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update offer status (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'O001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete offer (Admin)' })
  @ApiParam({ name: 'id', example: 'O001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) {
    return this.offerService.remove(id);
  }
}
