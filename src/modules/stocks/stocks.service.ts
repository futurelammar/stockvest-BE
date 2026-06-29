import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stock, StockDocument } from './schemas/stock.schema';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { QueryStocksDto } from './dto/query-stocks.dto';
import { StockStatus } from '../../common/enums/status.enum';
import { StockPriceProviderService } from './stock-price-provider.service';
import { CloudinaryService } from '../../uploads/cloudinary/cloudinary.service';

@Injectable()
export class StocksService {
  constructor(
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    private priceProvider: StockPriceProviderService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateStockDto, logoFile?: Express.Multer.File) {
    const existing = await this.stockModel.findOne({ ticker: dto.ticker.toUpperCase() });
    if (existing) throw new ConflictException(`A stock with ticker "${dto.ticker.toUpperCase()}" already exists`);

    let logoUrl: string | undefined;
    if (logoFile) {
      const result = await this.cloudinaryService.uploadImage(logoFile, 'stock-logos');
      logoUrl = result.secure_url;
    }

    if (dto.isCustom) {
      // Admin sets the price directly — no external lookup for synthetic stocks
      return this.stockModel.create({
        ...dto,
        logoUrl,
        currentPrice: dto.currentPrice,
        previousClose: dto.currentPrice,
      });
    }

    // Real ticker — try an immediate fetch so it isn't sitting at 0 until the next cron tick
    const quote = await this.priceProvider.getQuote(dto.ticker.toUpperCase());
    return this.stockModel.create({
      ...dto,
      logoUrl,
      currentPrice: quote?.price ?? 0,
      previousClose: quote?.previousClose ?? 0,
      changePercent: quote?.changePercent ?? 0,
      lastSyncedAt: quote ? new Date() : undefined,
    });
  }

  async update(id: string, dto: UpdateStockDto, logoFile?: Express.Multer.File) {
    const stock = await this.stockModel.findById(id);
    if (!stock) throw new NotFoundException('Stock not found');

    if (logoFile) {
      const result = await this.cloudinaryService.uploadImage(logoFile, 'stock-logos');
      stock.logoUrl = result.secure_url;
    }

    // Guard rail: real stock prices are cron-controlled, never admin-edited,
    // so the displayed price can never silently drift from the real market.
    if (!stock.isCustom && dto.currentPrice !== undefined) {
      throw new BadRequestException('Price for a real stock is synced automatically and cannot be edited directly');
    }

    if (stock.isCustom && dto.currentPrice !== undefined) {
      stock.previousClose = stock.currentPrice;
      stock.currentPrice = dto.currentPrice;
      stock.changePercent = stock.previousClose
        ? Math.round(((stock.currentPrice - stock.previousClose) / stock.previousClose) * 10000) / 100
        : 0;
    }

    const { currentPrice, ...rest } = dto;
    Object.assign(stock, rest);
    await stock.save();
    return stock;
  }

  async findAllActive(query: QueryStocksDto) {
    return this.findAll(query, StockStatus.ACTIVE);
  }

  async findAllAdmin(query: QueryStocksDto) {
    return this.findAll(query);
  }

  private async findAll(query: QueryStocksDto, statusOverride?: StockStatus) {
    const { page = 1, limit = 20, search, isCustom } = query;
    const filter: Record<string, any> = {};
    if (statusOverride) filter.status = statusOverride;
    if (typeof isCustom === 'boolean') filter.isCustom = isCustom;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ticker: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.stockModel.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      this.stockModel.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const stock = await this.stockModel.findById(id);
    if (!stock) throw new NotFoundException('Stock not found');
    return stock;
  }

  async disable(id: string) {
    const stock = await this.stockModel.findByIdAndUpdate(id, { status: StockStatus.INACTIVE }, { new: true });
    if (!stock) throw new NotFoundException('Stock not found');
    return stock;
  }
}