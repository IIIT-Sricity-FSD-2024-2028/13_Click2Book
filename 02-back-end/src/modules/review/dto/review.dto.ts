import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max, Length } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'C001' })
  @IsString() customerId: string;

  @ApiProperty({ example: 'T001' })
  @IsString() tripId: string;

  @ApiProperty({ example: 4 })
  @IsNumber() @Min(1) @Max(5) rating: number;

  @ApiPropertyOptional({ example: 'Great journey, clean bus!' })
  @IsOptional() @IsString() @Length(5, 500) comment?: string;
}
