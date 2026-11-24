import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, IsEnum, IsDateString, IsOptional, Min, Max, Length, Matches } from 'class-validator';
import { OfferStatus } from '../enums/offer-status.enum';

export class CreateOfferDto {
  @ApiPropertyOptional({ example: 'P001' })
  @IsOptional() @IsString() providerId?: string;

  @ApiProperty({ example: 'SUMMER20' })
  @IsString() @Length(3, 20) @Matches(/^[A-Za-z0-9_-]+$/) offerCode: string;

  @ApiPropertyOptional({ example: 'Discount on your next trip' })
  @IsOptional() @IsString() @Length(0, 200) description?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber() @Min(0.01) @Max(100) discountPercentage?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @IsNumber() @Min(0.01) flatDiscount?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional() @IsNumber() @Min(0) minFare?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional() @IsNumber() @Min(0.01) maxDiscount?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional() @IsInt() @Min(1) maxUsage?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt() @Min(1) maxUsagePerCustomer?: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString() startDate: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsDateString() endDate: string;
}

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'SUMMER20' })
  @IsOptional() @IsString() @Length(3, 20) @Matches(/^[A-Za-z0-9_-]+$/) offerCode?: string;

  @ApiPropertyOptional({ example: 'Discount on your next trip' })
  @IsOptional() @IsString() @Length(0, 200) description?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber() @Min(0.01) @Max(100) discountPercentage?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @IsNumber() @Min(0.01) flatDiscount?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional() @IsNumber() @Min(0) minFare?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional() @IsNumber() @Min(0.01) maxDiscount?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional() @IsInt() @Min(1) maxUsage?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt() @Min(1) maxUsagePerCustomer?: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional() @IsDateString() startDate?: string;

  @ApiPropertyOptional({ enum: OfferStatus })
  @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional() @IsDateString() endDate?: string;
}

export class ValidateOfferDto {
  @ApiProperty({ example: 'SUMMER20' })
  @IsString() @Length(3, 20) offerCode: string;

  @ApiProperty({ example: 600 })
  @IsNumber() @Min(0.01) fare: number;

  @ApiProperty({ example: 'C001' })
  @IsString() customerId: string;
}
