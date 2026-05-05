import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'B001' })
  @IsString() bookingId: string;

  @ApiProperty({ example: 600 })
  @IsNumber() @Min(0) amount: number;

  @ApiPropertyOptional({ example: 120, description: 'Discount applied from offer' })
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;

  @ApiProperty({ example: 'UPI', description: 'UPI | Card | NetBanking | Wallet' })
  @IsString() paymentMethod: string;
}
