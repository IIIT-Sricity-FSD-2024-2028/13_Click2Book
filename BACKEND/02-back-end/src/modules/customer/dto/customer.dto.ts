import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEmail, IsEnum, IsNumber, IsOptional,
  Min, Max, Length, MinLength,
} from 'class-validator';
import { Gender } from '../enums/gender.enum';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Santosh Kumar' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'santosh@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 21 })
  @IsNumber()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Length(10, 10)
  phoneNumber: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Santosh M' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '9876543211' })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  phoneNumber?: string;
}
