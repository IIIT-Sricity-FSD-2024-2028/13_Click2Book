import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { TrackingStatus } from '../enums/tracking-status.enum';

export class UpdateLocationDto {
  @ApiProperty({ example: 'P001', description: 'Provider updating the location — must own the trip\'s vehicle' })
  @IsString() providerId: string;

  @ApiProperty({ example: 17.385 })
  @IsNumber() lat: number;

  @ApiProperty({ example: 78.4867 })
  @IsNumber() lng: number;

  @ApiProperty({ enum: TrackingStatus, example: TrackingStatus.EN_ROUTE })
  @IsEnum(TrackingStatus) status: TrackingStatus;

  @ApiPropertyOptional({ example: 'Vijayawada' })
  @IsOptional() @IsString() nextStop?: string;
}
