import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { GenerateReportDto } from './dto/report.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Reports')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate daily booking + revenue report (Admin only)' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  generate(@Body() dto: GenerateReportDto) { return this.reportService.generate(dto); }

  @Get()
  @ApiOperation({ summary: 'Get all generated reports (Admin only)' })
  @ApiQuery({ name: 'adminId', required: false, example: 'A001' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-04' })
  @ApiHeader({ name: 'x-role', required: true, schema: { example: 'ADMIN' } })
  findAll(@Query('adminId') adminId?: string, @Query('date') date?: string) {
    if (adminId) return this.reportService.findByAdmin(adminId);
    if (date) return this.reportService.findByDate(date);
    return this.reportService.findAll();
  }
}
