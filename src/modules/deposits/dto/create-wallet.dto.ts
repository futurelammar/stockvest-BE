import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({ example: 'Bitcoin' })
  @IsString()
  @IsNotEmpty()
  coinName: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}