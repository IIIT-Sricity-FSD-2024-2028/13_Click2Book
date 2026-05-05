import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'APSRTC Travels' })
  @IsString() name: string;

  @ApiProperty({ example: 'apsrtc@example.com' })
  @IsEmail() email: string;

  @ApiProperty({ example: 'Provider@123' })
  @IsString() @MinLength(6) password: string;
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'APSRTC Premium Travels' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() approved?: boolean;
}
