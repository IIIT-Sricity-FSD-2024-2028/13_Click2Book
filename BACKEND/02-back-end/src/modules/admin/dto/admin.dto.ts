import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Admin One' })
  @IsString() name: string;

  @ApiProperty({ example: 'admin@click2book.com' })
  @IsEmail() email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString() @MinLength(6) password: string;
}
