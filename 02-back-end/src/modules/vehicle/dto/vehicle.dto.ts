import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, Length } from 'class-validator';
import { VehicleType } from '../enums/vehicle-type.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'P001' })
  @IsString()
  providerId: string;

  @ApiProperty({ example: 'AP09XX1234' })
  @IsString() @Length(4, 20)
  vehicleNumber: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.AC })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 40 })
  @IsNumber() @Min(1)
  totalSeats: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional() @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional() @IsNumber() @Min(1)
  totalSeats?: number;
}
