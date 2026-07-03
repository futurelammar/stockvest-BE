import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Stock, StockDocument } from '../../modules/stocks/schemas/stock.schema';

const REAL_STOCKS = [
  { name: 'Tesla, Inc.',                      ticker: 'TSLA', sector: 'Automotive' },
  { name: 'Ford Motor Company',               ticker: 'F',    sector: 'Automotive' },
  { name: 'General Motors Company',           ticker: 'GM',   sector: 'Automotive' },
  { name: 'Ferrari N.V.',                     ticker: 'RACE', sector: 'Automotive' },
  { name: 'Toyota Motor Corporation',         ticker: 'TM',   sector: 'Automotive' },
  { name: 'Rivian Automotive, Inc.',          ticker: 'RIVN', sector: 'Automotive' },
  { name: 'Lucid Group, Inc.',                ticker: 'LCID', sector: 'Automotive' },
  { name: 'Stellantis N.V.',                  ticker: 'STLA', sector: 'Automotive' },
  { name: 'Honda Motor Co., Ltd.',            ticker: 'HMC',  sector: 'Automotive' },
  { name: 'Nio Inc.',                         ticker: 'NIO',  sector: 'Automotive' },
  { name: 'Li Auto Inc.',                     ticker: 'LI',   sector: 'Automotive' },
  { name: 'XPeng Inc.',                       ticker: 'XPEV', sector: 'Automotive' },
  { name: 'Volkswagen AG',                    ticker: 'VWAGY',sector: 'Automotive' },
  { name: 'BYD Company Limited',              ticker: 'BYDDY',sector: 'Automotive' },
  { name: 'Aptiv PLC',                        ticker: 'APTV', sector: 'Automotive' },
  { name: 'Magna International Inc.',         ticker: 'MGA',  sector: 'Automotive' },
  { name: 'BorgWarner Inc.',                  ticker: 'BWA',  sector: 'Automotive' },
  { name: 'Gentex Corporation',               ticker: 'GNTX', sector: 'Automotive' },
  { name: 'Dorman Products, Inc.',            ticker: 'DORM', sector: 'Automotive' },
  { name: 'Modine Manufacturing Company',     ticker: 'MOD',  sector: 'Automotive' },
];

async function seedStocks() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stockModel = app.get<Model<StockDocument>>(getModelToken(Stock.name));

  let created = 0;
  let skipped = 0;

  for (const stock of REAL_STOCKS) {
    const existing = await stockModel.findOne({ ticker: stock.ticker });
    if (existing) { skipped++; continue; }
    await stockModel.create({ ...stock, isCustom: false, currentPrice: 0, previousClose: 0 });
    created++;
  }

  console.log(`✅ Seed complete — ${created} stock(s) created, ${skipped} already existed.`);
  console.log('Prices populate on the next cron tick (every 15 min).');
  await app.close();
  process.exit(0);
}

seedStocks().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});