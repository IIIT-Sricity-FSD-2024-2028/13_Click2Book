import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, Length, IsArray, IsBoolean } from 'class-validator';
import { VehicleType } from '../enums/vehicle-type.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'P001' })
  @IsString()
  providerId: string;

  @ApiProperty({ example: 'AP 27 AB 1234' })
  @IsString() @Length(4, 25)
  vehicleNumber: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.AC })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 40 })
  @IsNumber() @Min(1)
  totalSeats: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional() @IsNumber()
  remainingSeats?: number;

  @ApiPropertyOptional({ example: 'Garuda Express' })
  @IsOptional() @IsString()
  busName?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber()
  lowerBerths?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber()
  upperBerths?: number;

  @ApiPropertyOptional({ example: ['AC', 'Charging point', 'Wi-Fi', 'Water bottle'] })
  @IsOptional() @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({ example: [] })
  @IsOptional() @IsArray()
  photographs?: string[];

  @ApiPropertyOptional({ example: 'Available' })
  @IsOptional() @IsString()
  status?: 'Available' | 'Assigned' | 'Maintenance' | 'Inactive';

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional() @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ example: 'Majestic' })
  @IsOptional() @IsString()
  boardingPoint?: string;

  @ApiPropertyOptional({ example: 'CMBT' })
  @IsOptional() @IsString()
  droppingPoint?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional() @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional() @IsNumber() @Min(1)
  totalSeats?: number;

  @ApiPropertyOptional({ example: 'Garuda Express Luxury' })
  @IsOptional() @IsString()
  busName?: string;

  @ApiPropertyOptional({ example: 'Maintenance' })
  @IsOptional() @IsString()
  status?: 'Available' | 'Assigned' | 'Maintenance' | 'Inactive';

  @ApiPropertyOptional()
  @IsOptional() @IsArray()
  amenities?: string[];
}

export class SaveSeatLayoutDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  rows: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  cols: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  totalSeats: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber()
  lowerBerthsCount?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber()
  upperBerthsCount?: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  hasUpperDeck: boolean;

  @ApiProperty()
  @IsArray()
  lowerDeck: any[];

  @ApiPropertyOptional()
  @IsOptional() @IsArray()
  upperDeck?: any[];
}

export class AssignRouteDto {
  @ApiProperty({ example: 'Chennai' })
  @IsString()
  originCity: string;

  @ApiProperty({ example: 'Vijayawada' })
  @IsString()
  destCity: string;

  @ApiProperty({ example: 'CORR_CHN_BZA_A' })
  @IsString()
  corridorId: string;

  @ApiProperty({ example: 'Corridor A: NH16 Coastal Corridor' })
  @IsString()
  corridorName: string;

  @ApiPropertyOptional({ example: 430 })
  @IsOptional() @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional({ example: '6h 45m' })
  @IsOptional() @IsString()
  durationEst?: string;

  @ApiProperty({ example: ['Nayudupeta', 'Nellore', 'Ongole', 'Guntur'] })
  @IsArray()
  intermediateStops: string[];

  @ApiPropertyOptional({ example: '2026-11-25' })
  @IsOptional() @IsString()
  effectiveDate?: string;
}

export class ChangeRouteDto extends AssignRouteDto {
  @ApiPropertyOptional({ example: 'Route reallocated to meet weekend peak demand' })
  @IsOptional() @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  confirmReassignment?: boolean;
}

export class SaveRoundTripScheduleDto {
  @ApiProperty()
  upSchedule: {
    departureTime: string;
    arrivalTime: string;
    operatingDays: string[];
    intermediateStops?: any[];
    active?: boolean;
  };

  @ApiProperty()
  downSchedule: {
    departureTime: string;
    arrivalTime: string;
    operatingDays: string[];
    intermediateStops?: any[];
    active?: boolean;
  };

  @ApiProperty({ example: 650 })
  @IsNumber()
  fare: number;

  @ApiPropertyOptional({ example: '2026-11-25' })
  @IsOptional() @IsString()
  validFrom?: string;
}
