import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, Length } from 'class-validator';
import { LostFoundStatus } from '../enums/lost-found-status.enum';

export class CreateLostFoundItemDto {
  @ApiProperty({ example: 'T001' })
  @IsString() tripId: string;

  @ApiProperty({ example: 'B001' })
  @IsString() bookingId: string;

  @ApiProperty({ example: 'C001' })
  @IsString() customerId: string;

  @ApiProperty({ example: 'Black backpack with a laptop, left near seat 12' })
  @IsString() @Length(3, 500) itemDescription: string;

  @ApiPropertyOptional({ example: 'Bag' })
  @IsOptional() @IsString() category?: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsString() dateLost: string;

  @ApiProperty({ example: '9876543210' })
  @IsString() contactPhone: string;
}

export class UpdateLostFoundStatusDto {
  @ApiProperty({ enum: LostFoundStatus, example: LostFoundStatus.FOUND })
  @IsEnum(LostFoundStatus) status: LostFoundStatus;

  @ApiPropertyOptional({ example: 'Found under the last row, held at the depot office.' })
  @IsOptional() @IsString() @Length(0, 500) foundNote?: string;
}
