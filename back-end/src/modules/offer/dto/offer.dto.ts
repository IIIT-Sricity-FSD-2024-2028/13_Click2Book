import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsBoolean, Min, Max, Length, Matches } from 'class-validator';
import { OfferStatus } from '../enums/offer-status.enum';

const DAYS = /^\s*$|^(MON|TUE|WED|THU|FRI|SAT|SUN)(\s*,\s*(MON|TUE|WED|THU|FRI|SAT|SUN))*$/i;

/**
 * Offer fields. Give EITHER discountPercentage OR flatDiscount; every condition is optional.
 * List fields (validDays, vehicleTypes, paymentMethods) are comma-separated.
 */
export class CreateOfferDto {
  @ApiProperty({ example: 'DIWALI25' }) @IsString() @Length(3, 20) offerCode: string;
  @ApiPropertyOptional({ example: 'Diwali Dhamaka' }) @IsOptional() @IsString() @Length(0, 60) title?: string;
  @ApiPropertyOptional({ example: '25% off on all buses' }) @IsOptional() @IsString() @Length(0, 200) description?: string;

  // Discount
  @ApiPropertyOptional({ example: 25 }) @IsOptional() @IsNumber() @Min(1) @Max(100) discountPercentage?: number;
  @ApiPropertyOptional({ example: 100 }) @IsOptional() @IsNumber() @Min(1) flatDiscount?: number;
  @ApiPropertyOptional({ example: 200, description: '₹ cap for a percentage offer' }) @IsOptional() @IsNumber() @Min(1) maxDiscount?: number;

  // Time-based
  @ApiProperty({ example: '2026-10-20' }) @IsDateString() startDate: string;
  @ApiProperty({ example: '2026-11-05' }) @IsDateString() endDate: string;
  @ApiPropertyOptional({ example: 'SAT,SUN', description: 'Travel weekdays' })
  @IsOptional() @IsString() @Matches(DAYS, { message: 'validDays must be like SAT,SUN' }) validDays?: string;
  @ApiPropertyOptional({ example: 7, description: 'Early-bird: book at least N days ahead' }) @IsOptional() @IsNumber() @Min(0) minDaysAhead?: number;
  @ApiPropertyOptional({ example: 1, description: 'Last-minute: travel within N days' }) @IsOptional() @IsNumber() @Min(0) maxDaysAhead?: number;

  // User-based
  @ApiPropertyOptional({ example: true, description: 'Only for a customer with no earlier booking' }) @IsOptional() @IsBoolean() firstBookingOnly?: boolean;
  @ApiPropertyOptional({ example: 5, description: 'Loyalty: at least N earlier bookings' }) @IsOptional() @IsNumber() @Min(1) minPastBookings?: number;

  // Booking-based
  @ApiPropertyOptional({ example: 500 }) @IsOptional() @IsNumber() @Min(0) minFare?: number;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsNumber() @Min(1) minSeats?: number;
  @ApiPropertyOptional({ example: 'R001' }) @IsOptional() @IsString() routeId?: string;
  @ApiPropertyOptional({ example: 'Hyderabad' }) @IsOptional() @IsString() originCity?: string;

  // Bus-based
  @ApiPropertyOptional({ example: 'ALL' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: 'AC Sleeper,Volvo AC' }) @IsOptional() @IsString() vehicleTypes?: string;

  // Payment-based
  @ApiPropertyOptional({ example: 'UPI,CARD', description: 'UPI | CARD | NETBANKING | WALLET' }) @IsOptional() @IsString() paymentMethods?: string;

  // Usage limits
  @ApiPropertyOptional({ example: 1000 }) @IsOptional() @IsNumber() @Min(1) maxTotalUses?: number;
  @ApiPropertyOptional({ example: 1, description: '1 = one-time use per customer' }) @IsOptional() @IsNumber() @Min(1) maxUsesPerUser?: number;

  @ApiPropertyOptional({ enum: OfferStatus }) @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;
}

/** Same fields, all optional; the code itself cannot be changed. */
export class UpdateOfferDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 60) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 200) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(100) discountPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) flatDiscount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) maxDiscount?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(DAYS, { message: 'validDays must be like SAT,SUN' }) validDays?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minDaysAhead?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxDaysAhead?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() firstBookingOnly?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) minPastBookings?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minFare?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) minSeats?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() routeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() originCity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vehicleTypes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethods?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) maxTotalUses?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) maxUsesPerUser?: number;
  @ApiPropertyOptional({ enum: OfferStatus }) @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;
}
