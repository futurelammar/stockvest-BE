import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MinLength, MaxLength } from 'class-validator';

export class UpdateUserTotalsDto {
  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDeposited?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalInvested?: number;

  @ApiPropertyOptional({ example: 250 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalProfit?: number;

  @ApiPropertyOptional({ example: 400 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalWithdrawn?: number;

  @ApiProperty({ example: 'Corrected after offline deposit reconciliation' })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason: string;
}