import { IsMongoId, IsNumber, IsOptional, IsPositive, IsISO8601, IsBoolean } from 'class-validator';

export class AdminCreateInvestmentDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  planId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsISO8601()
  startDate?: string; // lets admin backdate the investment at creation time

  @IsOptional()
  @IsBoolean()
  deductFromBalance?: boolean; // default true — set false to create the investment without touching the user's balance
}