import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'R001' })
  @IsString() routeId: string;

  @ApiProperty({ example: 'P001' })
  @IsString() providerId: string;

  @ApiProperty({ example: '18:00' })
  @IsString() departureTime: string;

  @ApiProperty({ example: '22:00' })
  @IsString() arrivalTime: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString() journeyDate: string;

  @ApiProperty({ example: '06:00' })
  @IsString() arrivalTimeToDestination: string;

  @ApiProperty({ example: 600 })
  @IsNumber() @Min(1)
  fare: number;

  @ApiPropertyOptional({ example: 'Pune, Lonavala' })
  @IsOptional()
  @IsString()
  via?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ example: '19:00' })
  @IsOptional() @IsString() departureTime?: string;

  @ApiPropertyOptional({ example: 650 })
  @IsOptional() @IsNumber() @Min(1) fare?: number;

  @ApiPropertyOptional({ example: 'Pune, Lonavala' })
  @IsOptional()
  @IsString()
  via?: string;
}
