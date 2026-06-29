import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface StockQuote {
  price: number;
  previousClose: number;
  changePercent: number;
}

@Injectable()
export class StockPriceProviderService {
  private readonly logger = new Logger(StockPriceProviderService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('FINNHUB_API_KEY');
  }

  async getQuote(ticker: string): Promise<StockQuote | null> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/quote`, {
        params: { symbol: ticker, token: this.apiKey },
        timeout: 8000,
      });

      // Finnhub returns all zeros for an unknown/invalid ticker instead of an HTTP error
      if (!data || data.c === 0) {
        this.logger.warn(`No quote data returned for ${ticker}`);
        return null;
      }

      const price = data.c;
      const previousClose = data.pc;
      const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;

      return { price, previousClose, changePercent: Math.round(changePercent * 100) / 100 };
    } catch (error) {
      this.logger.error(`Failed to fetch quote for ${ticker}: ${error.message}`);
      return null;
    }
  }
}