import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Stock, StockDocument } from '../../modules/stocks/schemas/stock.schema';

const REAL_STOCKS = [
  { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology' },
  { name: 'Alphabet Inc. (Google)', ticker: 'GOOGL', sector: 'Technology' },
  { name: 'Microsoft Corporation', ticker: 'MSFT', sector: 'Technology' },
  { name: 'Amazon.com, Inc.', ticker: 'AMZN', sector: 'Consumer Discretionary' },
  { name: 'Tesla, Inc.', ticker: 'TSLA', sector: 'Automotive' },
  { name: 'Meta Platforms, Inc.', ticker: 'META', sector: 'Technology' },
  { name: 'NVIDIA Corporation', ticker: 'NVDA', sector: 'Technology' },
  { name: 'Netflix, Inc.', ticker: 'NFLX', sector: 'Media' },
  { name: 'JPMorgan Chase & Co.', ticker: 'JPM', sector: 'Financials' },
  { name: 'Visa Inc.', ticker: 'V', sector: 'Financials' },
  { name: 'Walmart Inc.', ticker: 'WMT', sector: 'Retail' },
  { name: 'The Walt Disney Company', ticker: 'DIS', sector: 'Media' },
  { name: 'The Coca-Cola Company', ticker: 'KO', sector: 'Consumer Staples' },
  { name: 'PepsiCo, Inc.', ticker: 'PEP', sector: 'Consumer Staples' },
  { name: 'Boeing Company', ticker: 'BA', sector: 'Industrials' },
  { name: 'Intel Corporation', ticker: 'INTC', sector: 'Technology' },
  { name: 'Advanced Micro Devices, Inc.', ticker: 'AMD', sector: 'Technology' },
  { name: 'PayPal Holdings, Inc.', ticker: 'PYPL', sector: 'Financials' },
  { name: 'Adobe Inc.', ticker: 'ADBE', sector: 'Technology' },
  { name: 'Oracle Corporation', ticker: 'ORCL', sector: 'Technology' },
];

async function seedStocks() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stockModel = app.get<Model<StockDocument>>(getModelToken(Stock.name));

  let created = 0;
  let skipped = 0;

  for (const stock of REAL_STOCKS) {
    const existing = await stockModel.findOne({ ticker: stock.ticker });
    if (existing) {
      skipped++;
      continue;
    }
    await stockModel.create({ ...stock, isCustom: false, currentPrice: 0, previousClose: 0 });
    created++;
  }

  console.log(`✅ Seed complete — ${created} stock(s) created, ${skipped} already existed.`);
  console.log('Prices populate on the next cron tick (every 15 min), or trigger one manually if needed.');
  await app.close();
  process.exit(0);
}

seedStocks().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});