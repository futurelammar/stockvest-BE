import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvestmentPlan, InvestmentPlanDocument } from './schemas/investment-plan.schema';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { QueryPlansDto } from './dto/query-plans.dto';
import { PlanStatus, StockStatus } from '../../common/enums/status.enum';
import { CloudinaryService } from '../../uploads/cloudinary/cloudinary.service';

@Injectable()
export class InvestmentPlansService {
  constructor(
    @InjectModel(InvestmentPlan.name) private planModel: Model<InvestmentPlanDocument>,
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreatePlanDto, file?: Express.Multer.File) {
    const stock = await this.stockModel.findById(dto.stockId);
    if (!stock) throw new NotFoundException('Stock not found');
    if (stock.status !== StockStatus.ACTIVE) {
      throw new BadRequestException('Cannot create a plan for an inactive stock');
    }

    let featuredImage: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file, 'plan-images');
      featuredImage = result.secure_url;
    }

    const { stockId, ...rest } = dto;
    return this.planModel.create({ ...rest, stock: stockId, featuredImage });
  }

  async update(id: string, dto: UpdatePlanDto, file?: Express.Multer.File) {
    const plan = await this.planModel.findById(id);
    if (!plan) throw new NotFoundException('Investment plan not found');

    if (dto.stockId) {
      const stock = await this.stockModel.findById(dto.stockId);
      if (!stock) throw new NotFoundException('Stock not found');
      plan.stock = stock._id as any;
    }

    if (file) {
      const result = await this.cloudinaryService.uploadImage(file, 'plan-images');
      plan.featuredImage = result.secure_url;
    }

    const { stockId, ...rest } = dto;
    Object.assign(plan, rest);
    await plan.save();
    return plan;
  }

  async findAllPublic(query: QueryPlansDto) {
    return this.findAll({ ...query, status: PlanStatus.ACTIVE });
  }

  async findAllAdmin(query: QueryPlansDto) {
    return this.findAll(query);
  }

  private async findAll(query: QueryPlansDto) {
    const { page = 1, limit = 10, search, stockId, status } = query;
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { planName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (stockId) filter.stock = stockId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
  
    const [data, total] = await Promise.all([
      this.planModel
        .find(filter)
        .populate('stock', 'name ticker logoUrl currentPrice changePercent isCustom')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.planModel.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const plan = await this.planModel
      .findById(id)
      .populate('stock', 'name ticker logoUrl currentPrice changePercent isCustom sector');
    if (!plan) throw new NotFoundException('Investment plan not found');
    return plan;
  }

  async deactivate(id: string) {
    const plan = await this.planModel.findByIdAndUpdate(id, { status: PlanStatus.INACTIVE }, { new: true });
    if (!plan) throw new NotFoundException('Investment plan not found');
    return plan;
  }
}