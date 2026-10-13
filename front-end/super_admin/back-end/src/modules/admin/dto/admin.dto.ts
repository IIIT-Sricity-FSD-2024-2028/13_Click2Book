import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsIn,
  IsArray,
} from 'class-validator';
import { ADMIN_PERMISSIONS, ADMIN_ROLES } from '../interfaces/admin.interface';
import type { AdminRole, AdminPermission } from '../interfaces/admin.interface';

const PERMS = ADMIN_PERMISSIONS as unknown as string[];

export class CreateAdminDto {
  @ApiProperty({ example: 'Admin One' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin1@click2book.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: ADMIN_ROLES, example: 'ADMIN' })
  @IsOptional()
  @IsIn(ADMIN_ROLES)
  role?: AdminRole;

  @ApiPropertyOptional({ isArray: true, enum: PERMS })
  @IsOptional()
  @IsArray()
  @IsIn(PERMS, { each: true })
  permissions?: AdminPermission[];
}

export class UpdateAdminDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: ADMIN_ROLES })
  @IsOptional()
  @IsIn(ADMIN_ROLES)
  role?: AdminRole;

  @ApiPropertyOptional({ isArray: true, enum: PERMS })
  @IsOptional()
  @IsArray()
  @IsIn(PERMS, { each: true })
  permissions?: AdminPermission[];

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
