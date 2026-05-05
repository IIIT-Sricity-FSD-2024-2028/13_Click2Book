import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCancellationDto {
  @ApiProperty({ example: 'B001', description: 'Booking ID to cancel' })
  @IsString() bookingId: string;
}
