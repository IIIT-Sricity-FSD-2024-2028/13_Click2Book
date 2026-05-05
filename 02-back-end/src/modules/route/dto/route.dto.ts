import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Length } from 'class-validator';

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
}
