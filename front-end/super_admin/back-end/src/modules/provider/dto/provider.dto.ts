import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'APSRTC Travels' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'apsrtc@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Provider@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'OL-2026-0001',
    description: 'Operator licence number',
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'SCP-2026-0001',
    description: 'Stage-carriage / contract-carriage permit number',
  })
  @IsOptional()
  @IsString()
  permitNumber?: string;

  @ApiPropertyOptional({
    example: '36ABCDE1234F1Z5',
    description: 'GST registration number',
  })
  @IsOptional()
  @IsString()
  gstNumber?: string;
}

/** Provider self-service profile update. Approval is NOT here — only an admin can approve (PATCH /providers/:id/approve). */
export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'APSRTC Premium Travels' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Apsrtc@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass@123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class SubmitDocumentsDto {
  @ApiPropertyOptional({ example: 'OL-2026-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'SCP-2026-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  permitNumber?: string;

  @ApiPropertyOptional({ example: '36ABCDE1234F1Z5' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  gstNumber?: string;
}

export class ReviewDocumentDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'], example: 'VERIFIED' })
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Licence number matches RTO record' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class ReasonDto {
  @ApiPropertyOptional({ example: 'Expired permit' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
