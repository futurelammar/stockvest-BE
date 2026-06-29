import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stock, StockDocument } from './schemas/stock.schema';
import { StockPriceProviderService } from './stock-price-provider.service';
import { StockStatus } from '../../common/enums/status.enum';

@Injectable()
export class StocksCron {
  private logger = new Logger(StocksCron.name);

  constructor(
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    private priceProvider: StockPriceProviderService,
  ) {}

  // Real stocks only — custom stocks are priced manually and never touched here.
  // 15-minute interval is comfortably under Finnhub's 60 calls/min free-tier limit for ~20 tickers.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncRealStockPrices() {
    const realStocks = await this.stockModel.find({ isCustom: false, status: StockStatus.ACTIVE });
    if (realStocks.length === 0) return;

    this.logger.log(`Syncing prices for ${realStocks.length} real stock(s)`);

    for (const stock of realStocks) {
      const quote = await this.priceProvider.getQuote(stock.ticker);
      if (!quote) continue;

      stock.currentPrice = quote.price;
      stock.previousClose = quote.previousClose;
      stock.changePercent = quote.changePercent;
      stock.lastSyncedAt = new Date();
      await stock.save();

      // Small spacing between calls — not needed at 20 stocks, but keeps this
      // safe if the catalog grows without having to revisit rate limits later.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}