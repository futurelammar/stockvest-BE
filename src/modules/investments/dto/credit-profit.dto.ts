import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreditProfitDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  reason: string;
}