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

  async getQuote(ticker: string, retries = 1): Promise<StockQuote | null> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/quote`, {
        params: { symbol: ticker, token: this.apiKey },
        timeout: 8000,
      });

      if (!data || data.c === 0) {
        this.logger.warn(`No quote data returned for ${ticker} — may be an invalid ticker`);
        return null;
      }

      const price = data.c;
      const previousClose = data.pc;
      const changePercent = previousClose
        ? ((price - previousClose) / previousClose) * 100
        : 0;

      return {
        price,
        previousClose,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 429 && retries > 0) {
        // Rate limited — wait 65 seconds and try once more
        this.logger.warn(
          `Rate limited (429) on ${ticker} — waiting 65s then retrying once`,
        );
        await new Promise((resolve) => setTimeout(resolve, 65000));
        return this.getQuote(ticker, retries - 1);
      }

      this.logger.error(
        `Failed to fetch quote for ${ticker}: ${error.message}`,
      );
      return null;
    }
  }
}