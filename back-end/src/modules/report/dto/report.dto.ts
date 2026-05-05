import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({ example: 'A001' })
  @IsString() adminId: string;

  @ApiProperty({ example: '2026-05-04' })
  @IsDateString() reportDate: string;
}
