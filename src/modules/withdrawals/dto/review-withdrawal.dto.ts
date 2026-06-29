import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewWithdrawalDto {
  @ApiPropertyOptional({ example: 'Wallet address format is invalid for this network' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}