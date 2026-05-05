import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/review.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Reviews')
@UseGuards(RolesGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Submit a review (Customer)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  create(@Body() dto: CreateReviewDto) { return this.reviewService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  findAll() { return this.reviewService.findAll(); }

  @Get('customer/:customerId')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Get reviews by customer' })
  @ApiParam({ name: 'customerId', example: 'C001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } })
  findByCustomer(@Param('customerId') cid: string) { return this.reviewService.findByCustomer(cid); }

  @Get('trip/:tripId')
  @ApiOperation({ summary: 'Get reviews for a trip' })
  @ApiParam({ name: 'tripId', example: 'T001' })
  findByTrip(@Param('tripId') tid: string) { return this.reviewService.findByTrip(tid); }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a review (Admin)' })
  @ApiParam({ name: 'id', example: 'REV001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) { return this.reviewService.remove(id); }
}
