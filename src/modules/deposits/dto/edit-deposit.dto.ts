import { IsOptional, IsNumber, IsString, IsISO8601, IsPositive } from 'class-validator';

export class EditDepositDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  coinName?: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: string; // admin can backdate or frontdate the deposit
}