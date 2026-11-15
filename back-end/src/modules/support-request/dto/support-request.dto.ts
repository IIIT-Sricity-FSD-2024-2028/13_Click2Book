import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { SupportStatus } from '../enums/support-status.enum';

export class CreateSupportRequestDto {
  @ApiProperty({ example: 'C001' })
  @IsString() customerId: string;

  @ApiProperty({ example: 'My booking B001 was confirmed but seat not assigned.' })
  @IsString() @Length(5, 1000) description: string;

  @ApiPropertyOptional({ example: 'B001', description: 'Booking this request relates to, if any' })
  @IsOptional() @IsString() bookingId?: string;

  @ApiPropertyOptional({ example: 'complaint' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() requestId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() supporterId?: string;

  @ApiPropertyOptional({ enum: SupportStatus, example: SupportStatus.OPEN })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsEnum(SupportStatus)
  status?: SupportStatus;

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
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const u = value.toUpperCase().trim();
      if (u === 'RESOLVED' || u === 'APPROVED' || u === 'CLOSED') return SupportStatus.RESOLVED;
      if (u === 'IN_PROGRESS' || u === 'UNDER INVESTIGATION' || u === 'PENDING') return SupportStatus.IN_PROGRESS;
      if (u === 'OPEN') return SupportStatus.OPEN;
      return u;
    }
    return value;
  })
  @IsEnum(SupportStatus)
  status?: SupportStatus;

  @ApiPropertyOptional({ example: 'Issue investigated and resolved.' })
  @IsOptional() @IsString() resolution?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() remarks?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional()
  @IsOptional() verificationChecklist?: any;

  @ApiPropertyOptional({ example: 'Support Agent' })
  @IsOptional() @IsString() resolvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() resolvedAt?: string;
}

