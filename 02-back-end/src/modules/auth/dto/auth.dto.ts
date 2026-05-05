import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'rahul@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Rahul@123' })
  @IsString()
  @MinLength(6)
  password: string;
}
