import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'C001' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: 'T001' })
  @IsString()
  tripId: string;

  @ApiProperty({ example: 12, description: 'Seat number to book' })
  @IsNumber()
  @Min(1)
  seatNumber: number;

  @ApiPropertyOptional({
    example: 'SUMMER20',
    description: 'Optional offer code',
  })
  @IsOptional()
  @IsString()
  offerCode?: string;

  @ApiPropertyOptional({
    example: 'Chennai',
    description: 'Segment boarding city',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    example: 'Ongole',
    description: 'Segment dropping city',
  })
  @IsOptional()
  @IsString()
  to?: string;
}
