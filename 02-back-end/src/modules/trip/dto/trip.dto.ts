import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TripStatus } from '../enums/trip-status.enum';

export class CreateTripDto {
  @ApiProperty({ example: 'SCH001' })
  @IsString() scheduleId: string;

  @ApiProperty({ example: 'V001' })
  @IsString() vehicleId: string;
}

export class UpdateTripStatusDto {
  @ApiProperty({ enum: TripStatus, example: TripStatus.IN_PROGRESS })
  @IsEnum(TripStatus) tripStatus: TripStatus;
}
