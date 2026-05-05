import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, Max, Length } from 'class-validator';
import { OfferStatus } from '../enums/offer-status.enum';

export class CreateOfferDto {
  @ApiProperty({ example: 'P001' })
  @IsString() providerId: string;

  @ApiProperty({ example: 'SUMMER20' })
  @IsString() @Length(3, 20) offerCode: string;

  @ApiProperty({ example: 20 })
  @IsNumber() @Min(1) @Max(100) discountPercentage: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString() startDate: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsDateString() endDate: string;
}

export class UpdateOfferDto {
  @ApiPropertyOptional({ enum: OfferStatus })
  @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional() @IsDateString() endDate?: string;
}
