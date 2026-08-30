import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsIn, Length } from 'class-validator';
import { SupportStatus } from '../enums/support-status.enum';

export class CreateSupportRequestDto {
  @ApiProperty({ example: 'C001' })
  @IsString() customerId: string;

  @ApiProperty({ example: 'My booking B001 was confirmed but seat not assigned.' })
  @IsString() @Length(10, 1000) description: string;

  @ApiPropertyOptional({ example: 'B001', description: 'Booking this request relates to, if any' })
  @IsOptional() @IsString() bookingId?: string;

  @ApiPropertyOptional({ example: 'complaint', enum: ['complaint', 'dispute'] })
  @IsOptional() @IsIn(['complaint', 'dispute']) category?: 'complaint' | 'dispute';
}

export class UpdateSupportRequestDto {
  @ApiPropertyOptional({ example: 'SUP001' })
  @IsOptional() @IsString() supporterId?: string;

  @ApiPropertyOptional({ enum: SupportStatus, example: SupportStatus.RESOLVED })
  @IsOptional() @IsEnum(SupportStatus) status?: SupportStatus;
}
