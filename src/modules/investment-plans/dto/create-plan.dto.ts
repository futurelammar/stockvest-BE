import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanStatus } from '../../../common/enums/status.enum';

export class CreatePlanDto {
  @ApiProperty({ example: 'Google Growth Plan' })
  @IsString()
  @IsNotEmpty()
  planName: string;

  @ApiProperty({ example: 'A plan themed around steady tech-sector growth, inspired by Alphabet Inc. (GOOGL).' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '665f1c2e8b3a9d0012345678', description: 'The Stock this plan is themed around' })
  @IsMongoId()
  stockId: string;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationInDays: number;

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  roiPercentage: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minimumInvestment: number;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maximumInvestment: number;

  @ApiPropertyOptional({ enum: PlanStatus })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}