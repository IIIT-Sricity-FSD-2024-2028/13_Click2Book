import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateSupportStaffDto {
  @ApiProperty({ example: 'Rahul Support' })
  @IsString() name: string;

  @ApiProperty({ example: 'rahul@click2book.com' })
  @IsEmail() email: string;

  @ApiProperty({ example: 'Support@123' })
  @IsString() @MinLength(6) password: string;
}
