import { PartialType } from '@nestjs/swagger';
import { CreateStockDto } from './create-stock.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../../common/enums/status.enum';

export class UpdateStockDto extends PartialType(CreateStockDto) {
  @ApiPropertyOptional({ enum: StockStatus })
  @IsOptional()
  @IsEnum(StockStatus)
  status?: StockStatus;
}