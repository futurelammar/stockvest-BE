import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockDto {
  @ApiProperty({ example: 'Alphabet Inc. (Google)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'GOOGL' })
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({
    example: false,
    description: 'true = admin-priced synthetic stock, false = real ticker synced automatically',
  })
  @Type(() => Boolean)
  @IsBoolean()
  isCustom: boolean;

  @ApiPropertyOptional({
    example: 150,
    description: 'Required when isCustom is true. Ignored for real tickers — those are priced automatically.',
  })
  @ValidateIf((dto) => dto.isCustom === true)
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  currentPrice?: number;
}