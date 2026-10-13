import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsNumber, IsOptional, Max, Min, ValidateNested,
} from 'class-validator';

export class SupportCostWeightsDto {
  @ApiPropertyOptional({ example: 800, description: 'Cost drawn (paise) per cancellation ticket' })
  @IsOptional() @IsInt() @Min(0) cancellation?: number;

  @ApiPropertyOptional({ example: 3500, description: 'Cost drawn (paise) per complaint ticket' })
  @IsOptional() @IsInt() @Min(0) complaint?: number;

  @ApiPropertyOptional({ example: 0, description: 'Cost drawn (paise) per SOS ticket — always forced to 0' })
  @IsOptional() @IsInt() @Min(0) sos?: number;

  @ApiPropertyOptional({ example: 1500, description: 'Cost drawn (paise) per lost & found ticket' })
  @IsOptional() @IsInt() @Min(0) lost_and_found?: number;

  @ApiPropertyOptional({ example: 3000, description: 'Cost drawn (paise) per dispute ticket' })
  @IsOptional() @IsInt() @Min(0) dispute?: number;
}

export class UpdateRevenueSplitConfigDto {
  @ApiPropertyOptional({ example: 10, description: 'Platform commission percentage of base fare' })
  @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPct?: number;

  @ApiPropertyOptional({ example: 2500, description: 'Flat convenience fee per booking, in paise' })
  @IsOptional() @IsInt() @Min(0) convenienceFeeFlat?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Payment gateway fee percentage of base fare' })
  @IsOptional() @IsNumber() @Min(0) @Max(100) gatewayFeePct?: number;

  @ApiPropertyOptional({ type: SupportCostWeightsDto })
  @IsOptional() @ValidateNested() @Type(() => SupportCostWeightsDto)
  supportCostWeights?: SupportCostWeightsDto;
}
