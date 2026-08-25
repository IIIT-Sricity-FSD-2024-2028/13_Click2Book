import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiParam, ApiHeader, ApiResponse,
  ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { profileUploadOptions } from '../../common/middleware/upload.middleware';

@ApiTags('Customers')
@UseGuards(RolesGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({ status: 201, description: 'Customer registered' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all customers (Admin only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findOne(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @Put(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiParam({ name: 'id', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete customer (Admin only)' })
  @ApiParam({ name: 'id', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  // ── Phase 5B: Profile Picture Upload ────────────────────────────────────
  @Post(':id/profile-picture')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', profileUploadOptions))
  @ApiOperation({ summary: 'Upload customer profile picture (JPEG/PNG, max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Profile image (JPEG/PNG, max 5 MB)' },
      },
      required: ['file'],
    },
  })
  @ApiParam({ name: 'id', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  @ApiResponse({ status: 201, description: 'Profile picture uploaded' })
  @ApiResponse({ status: 400, description: 'No file / wrong type / too large' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded. Send a JPEG or PNG as multipart/form-data field "file".');
    return this.customerService.uploadProfilePicture(id, file.filename);
  }
}
