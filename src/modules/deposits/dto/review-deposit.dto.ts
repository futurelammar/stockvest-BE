import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewDepositDto {
  @ApiPropertyOptional({ example: 'Proof of payment did not match the amount sent' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}