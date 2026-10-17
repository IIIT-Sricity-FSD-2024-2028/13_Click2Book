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

  @ApiPropertyOptional({ example: 'complaint' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() requestId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() supporterId?: string;

  @ApiPropertyOptional({ enum: SupportStatus, example: SupportStatus.OPEN })
  @IsOptional() @IsEnum(SupportStatus) status?: SupportStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString() customerName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() createdAt?: string;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional() @IsString() priority?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() resolution?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() resolvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() resolvedAt?: string;
}

export class UpdateSupportRequestDto {
  @ApiPropertyOptional({ example: 'SUP001' })
  @IsOptional() @IsString() supporterId?: string;

  @ApiPropertyOptional({ enum: SupportStatus, example: SupportStatus.RESOLVED })
  @IsOptional() @IsEnum(SupportStatus) status?: SupportStatus;

  @ApiPropertyOptional({ example: 'Issue investigated and resolved.' })
  @IsOptional() @IsString() resolution?: string;

  @ApiPropertyOptional({ example: 'Support Agent' })
  @IsOptional() @IsString() resolvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() resolvedAt?: string;
}

