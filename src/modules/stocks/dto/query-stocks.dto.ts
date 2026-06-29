import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryStocksDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'goog' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isCustom?: boolean;
}