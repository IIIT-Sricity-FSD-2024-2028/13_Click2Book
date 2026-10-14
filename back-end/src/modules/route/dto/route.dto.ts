import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Length } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: 'Hyderabad' })
  @IsString() @Length(2, 100)
  source: string;

  @ApiProperty({ example: 'Chennai' })
  @IsString() @Length(2, 100)
  destination: string;

  @ApiProperty({ example: 625 })
  @IsNumber() @Min(1)
  distance: number;

  @ApiPropertyOptional({ example: 'Pune, Lonavala' })
  @IsOptional() @IsString()
  via?: string;
}
