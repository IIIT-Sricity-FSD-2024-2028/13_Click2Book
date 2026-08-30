import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, Length } from 'class-validator';
import { IrctcStatus } from '../enums/irctc-status.enum';

export class CreateIrctcDto {
  @ApiProperty({ example: 'santosh_irctc' })
  @IsString() @Length(4, 20) irctcUsername: string;

  @ApiProperty({ example: '9876543210' })
  @IsString() @Length(10, 10) linkedPhoneNumber: string;
}

export class UpdateIrctcStatusDto {
  @ApiProperty({ enum: IrctcStatus, example: IrctcStatus.VERIFIED })
  @IsEnum(IrctcStatus) verificationStatus: IrctcStatus;
}
