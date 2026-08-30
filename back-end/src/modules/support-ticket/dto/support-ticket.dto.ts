import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { TicketCategory } from '../enums/ticket-category.enum';
import { TicketSourceModule } from '../interfaces/support-ticket.interface';

const SOURCE_MODULES: TicketSourceModule[] = ['support-request', 'emergency', 'lost-found', 'manual'];

export class CreateSupportTicketDto {
  @ApiProperty({ example: 'B001' })
  @IsString() bookingId: string;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.COMPLAINT })
  @IsEnum(TicketCategory) category: TicketCategory;

  @ApiPropertyOptional({ enum: SOURCE_MODULES, example: 'manual' })
  @IsOptional() @IsIn(SOURCE_MODULES) sourceModule?: TicketSourceModule;

  @ApiPropertyOptional({ example: 'SUP001', description: 'Support agent this ticket is assigned to, if any' })
  @IsOptional() @IsString() agentId?: string;
}
