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
  private isSyncing = false; // prevents overlapping runs

  constructor(
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    private priceProvider: StockPriceProviderService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncRealStockPrices() {
    // Guard: if a previous run is still in progress (e.g. slow API responses
    // during a restart storm), skip this tick entirely rather than stacking runs
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress — skipping this tick');
      return;
    }

    const realStocks = await this.stockModel.find({
      isCustom: false,
      status: StockStatus.ACTIVE,
    });

    if (realStocks.length === 0) return;

    this.isSyncing = true;
    this.logger.log(`Syncing prices for ${realStocks.length} real stock(s)`);

    let successCount = 0;
    let failCount = 0;

    for (const stock of realStocks) {
      const quote = await this.priceProvider.getQuote(stock.ticker);

      if (!quote) {
        failCount++;
        // 1.5s between calls — 20 stocks = ~30 seconds total, well within
        // Finnhub's 60 calls/min free-tier limit with headroom to spare
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      stock.currentPrice = quote.price;
      stock.previousClose = quote.previousClose;
      stock.changePercent = quote.changePercent;
      stock.lastSyncedAt = new Date();
      await stock.save();
      successCount++;

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    this.isSyncing = false;
    this.logger.log(
      `Sync complete — ${successCount} updated, ${failCount} failed`,
    );
  }
}