import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { RefundStatus } from '../enums/refund-status.enum';

export class CreateRefundDto {
  @ApiProperty({ example: 'B001' })
  @IsString() bookingId: string;

  @ApiProperty({ example: 480 })
  @IsNumber() @Min(0) refundAmount: number;
}

export class ProcessRefundDto {
  @ApiProperty({ example: 'A001' })
  @IsString() adminId: string;

  @ApiProperty({ enum: RefundStatus, example: RefundStatus.COMPLETED })
  @IsEnum(RefundStatus) refundStatus: RefundStatus;
}
