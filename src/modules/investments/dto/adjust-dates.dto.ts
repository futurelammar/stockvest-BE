import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustInvestmentDatesDto {
  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  maturityDate?: string;
}