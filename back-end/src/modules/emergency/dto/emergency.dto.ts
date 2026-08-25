import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Length } from 'class-validator';
import { EmergencyType } from '../enums/emergency-type.enum';

export class CreateEmergencyAlertDto {
  @ApiProperty({ example: 'B001' })
  @IsString() bookingId: string;

  @ApiProperty({ example: 'C001' })
  @IsString() customerId: string;

  @ApiProperty({ enum: EmergencyType, example: EmergencyType.SAFETY })
  @IsEnum(EmergencyType) type: EmergencyType;

  @ApiPropertyOptional({ example: 'Driver is speeding and passengers are worried.' })
  @IsOptional() @IsString() @Length(0, 500) message?: string;

  @ApiPropertyOptional({ example: 17.385 })
  @IsOptional() @IsNumber() lat?: number;

  @ApiPropertyOptional({ example: 78.4867 })
  @IsOptional() @IsNumber() lng?: number;
}
