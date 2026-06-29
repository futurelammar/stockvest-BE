import { PartialType } from '@nestjs/swagger';
import { CreateWalletDto } from './create-wallet.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WalletStatus } from '../../../common/enums/status.enum';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {
  @ApiPropertyOptional({ enum: WalletStatus })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;
}