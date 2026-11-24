import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Length, IsEnum } from 'class-validator';

export class CreateLocationRequestDto {
  @ApiProperty({ example: '7998906' })
  @IsString()
  osmId: string;

  @ApiPropertyOptional({ example: 'node' })
  @IsOptional()
  @IsString()
  osmType?: string;

  @ApiProperty({ example: 'Warangal' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Warangal, Telangana, India' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'city' })
  @IsString()
  locationType: string;

  @ApiProperty({ example: 17.9689 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 79.5941 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: { state: 'Telangana', country: 'India' } })
  @IsOptional()
  address?: any;

  @ApiPropertyOptional({ example: 'Telangana' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'P001' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ example: 'Kiran Travels' })
  @IsOptional()
  @IsString()
  providerName?: string;

  @ApiPropertyOptional({ example: 'Hyderabad ↔ Warangal' })
  @IsOptional()
  @IsString()
  connectingRoutes?: string;

  @ApiPropertyOptional({ example: 'High passenger traffic on this corridor' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectLocationRequestDto {
  @ApiPropertyOptional({ example: 'Duplicate route coverage or insufficient infrastructure' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'A001' })
  @IsOptional()
  @IsString()
  decidedBy?: string;
}

export class DirectCreateLocationDto {
  @ApiProperty({ example: 'Guntur' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Guntur, Andhra Pradesh, India' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: '7998950' })
  @IsString()
  osmId: string;

  @ApiPropertyOptional({ example: 'node' })
  @IsOptional()
  @IsString()
  osmType?: string;

  @ApiProperty({ example: 'city' })
  @IsString()
  locationType: string;

  @ApiProperty({ example: 16.3067 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 80.4365 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  address?: any;

  @ApiPropertyOptional({ example: 'Andhra Pradesh' })
  @IsOptional()
  @IsString()
  state?: string;
}

