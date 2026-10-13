import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { ProviderService } from './provider.service';
import {
  CreateProviderDto,
  UpdateProviderDto,
  ReviewDocumentDto,
  ReasonDto,
  ChangePasswordDto,
  SubmitDocumentsDto,
} from './dto/provider.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Providers')
@UseGuards(RolesGuard)
@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new service provider (Public)' })
  create(@Body() dto: CreateProviderDto) {
    return this.providerService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all providers (Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() {
    return this.providerService.findAll();
  }

  @Get(':id/dashboard')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Get provider dashboard stats (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  getDashboard(@Param('id') id: string) {
    return this.providerService.getDashboard(id);
  }

  @Get(':id/revenue')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({
    summary: "Get this provider's ledger-derived earnings (Provider/Admin)",
  })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  getRevenue(@Param('id') id: string) {
    return this.providerService.getRevenue(id);
  }

  @Get(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  findOne(@Param('id') id: string) {
    return this.providerService.findById(id);
  }

  @Put(':id')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Update provider settings (Provider)' })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providerService.update(id, dto);
  }

  @Put(':id/password')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Change the provider account password (Provider)' })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.providerService.changePassword(
      id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Put(':id/documents')
  @Roles(Role.PROVIDER)
  @ApiOperation({
    summary:
      'Submit or update compliance document numbers for verification (Provider)',
  })
  @ApiParam({ name: 'id', example: 'P001' })
  @ApiHeader({
    name: 'x-role',
    required: true,
    schema: { example: 'PROVIDER' },
  })
  submitDocuments(@Param('id') id: string, @Body() dto: SubmitDocumentsDto) {
    return this.providerService.submitDocuments(id, dto);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve a provider (Admin only)' })
  @ApiParam({ name: 'id', example: 'P003' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  approve(@Param('id') id: string) {
    return this.providerService.approve(id);
  }

  @Patch(':id/suspend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Suspend (un-approve) a provider (Admin only)' })
  @ApiParam({ name: 'id', example: 'P003' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  suspend(@Param('id') id: string, @Body() dto: ReasonDto) {
    return this.providerService.suspend(id, dto?.reason);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject a provider application (Admin only)' })
  @ApiParam({ name: 'id', example: 'P003' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  reject(@Param('id') id: string, @Body() dto: ReasonDto) {
    return this.providerService.reject(id, dto?.reason);
  }

  @Patch(':id/documents/:index')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Verify or reject one of a provider's documents (Admin only)",
  })
  @ApiParam({ name: 'id', example: 'P003' })
  @ApiParam({ name: 'index', example: 0 })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  reviewDocument(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() dto: ReviewDocumentDto,
  ) {
    return this.providerService.reviewDocument(
      id,
      Number(index),
      dto.status,
      dto.note,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a provider (Admin only)' })
  @ApiParam({ name: 'id', example: 'P003' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) {
    return this.providerService.remove(id);
  }
}
