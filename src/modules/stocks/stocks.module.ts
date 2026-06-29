import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from './schemas/stock.schema';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { StocksCron } from './stocks.cron';
import { StockPriceProviderService } from './stock-price-provider.service';
import { CloudinaryModule } from '../../uploads/uploads.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]), CloudinaryModule],
  controllers: [StocksController],
  providers: [StocksService, StocksCron, StockPriceProviderService],
  exports: [StocksService],
})
export class StocksModule {}