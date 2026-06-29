import { IsMongoId, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvestmentDto {
  @ApiProperty({ example: '665f1c2e8b3a9d0012345678' })
  @IsMongoId()
  planId: string;

  @ApiProperty({ example: 200 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;
}