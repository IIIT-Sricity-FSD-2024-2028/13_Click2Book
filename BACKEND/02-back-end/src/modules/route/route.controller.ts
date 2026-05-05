import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/route.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Routes')
@UseGuards(RolesGuard)
@Controller('routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new route (Provider/Admin)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  create(@Body() dto: CreateRouteDto) { return this.routeService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all routes' })
  @ApiQuery({ name: 'source', required: false, example: 'Hyderabad' })
  @ApiQuery({ name: 'destination', required: false, example: 'Chennai' })
  findAll(@Query('source') source?: string, @Query('destination') destination?: string) {
    if (source && destination) return this.routeService.search(source, destination);
    return this.routeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route by ID' })
  @ApiParam({ name: 'id', example: 'R001' })
  findOne(@Param('id') id: string) { return this.routeService.findById(id); }

  @Put(':id')
  @Roles(Role.PROVIDER, Role.ADMIN)
  @ApiOperation({ summary: 'Update route (Provider/Admin)' })
  @ApiParam({ name: 'id', example: 'R001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } })
  update(@Param('id') id: string, @Body() dto: CreateRouteDto) {
    return this.routeService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete route (Admin only)' })
  @ApiParam({ name: 'id', example: 'R001' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  remove(@Param('id') id: string) { return this.routeService.remove(id); }
}
