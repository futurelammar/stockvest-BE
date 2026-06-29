import { IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustBalanceDto {
  @ApiProperty({ example: 50, description: 'Positive to credit, negative to debit' })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Goodwill credit for delayed deposit approval' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}