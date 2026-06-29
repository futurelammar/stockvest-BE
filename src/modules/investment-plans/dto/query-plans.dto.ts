import { IsOptional, IsString, IsInt, Min, IsEnum, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlanStatus } from '../../../common/enums/status.enum';

export class QueryPlansDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'growth' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '665f1c2e8b3a9d0012345678' })
  @IsOptional()
  @IsMongoId()
  stockId?: string;

  @ApiPropertyOptional({ enum: PlanStatus })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}