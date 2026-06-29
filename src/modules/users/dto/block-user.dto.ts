import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BlockUserDto {
  @ApiPropertyOptional({ example: 'Suspicious activity detected on this account' })
  @IsOptional()
  @IsString()
  reason?: string;
}