import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { RefundStatus } from '../enums/refund-status.enum';

export class CreateRefundDto {
  @ApiProperty({ example: 'B001' })
  @IsString() bookingId: string;

  @ApiProperty({ example: 480 })
  @IsNumber() @Min(0) refundAmount: number;

  @ApiPropertyOptional({ example: 'REF-B001' })
  @IsOptional() @IsString() refundId?: string;

  @ApiPropertyOptional({ example: 'C001' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ example: 'Rahul Verma' })
  @IsOptional() @IsString() passengerName?: string;

  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsOptional() @IsString() reason?: string;
}

export class ProcessRefundDto {
  @ApiPropertyOptional({ example: 'SUP001' })
  @IsOptional() @IsString() adminId?: string;

  @ApiProperty({ enum: RefundStatus, example: RefundStatus.COMPLETED })
  @IsEnum(RefundStatus) refundStatus: RefundStatus;
}

