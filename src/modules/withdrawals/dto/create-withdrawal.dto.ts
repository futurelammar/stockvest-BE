import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  coinType: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ example: 'TXYZabc123...' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;
}