import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Investment, InvestmentDocument } from './schemas/investment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { QueryInvestmentsDto } from './dto/query-investments.dto';
import { AdjustInvestmentDatesDto } from './dto/adjust-dates.dto';
import { InvestmentPlansService } from '../investment-plans/investment-plans.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InvestmentStatus, PlanStatus } from '../../common/enums/status.enum';
import { TransactionType, TransactionStatus } from '../../common/enums/transaction-type.enum';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private plansService: InvestmentPlansService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateInvestmentDto) {
    const plan = await this.plansService.findOne(dto.planId);

    if (plan.status !== PlanStatus.ACTIVE) {
      throw new BadRequestException('This investment plan is not currently active');
    }
    if (dto.amount < plan.minimumInvestment || dto.amount > plan.maximumInvestment) {
      throw new BadRequestException(
        `Amount must be between ${plan.minimumInvestment} and ${plan.maximumInvestment}`,
      );
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance. Please deposit funds first.');
    }

    const startDate = new Date();
    const maturityDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);
    const expectedProfit = Math.round(((dto.amount * plan.roiPercentage) / 100) * 100) / 100;

    user.balance -= dto.amount;
    user.totalInvested += dto.amount;
    await user.save();

    const investment = await this.investmentModel.create({
      user: user._id,
      plan: plan._id,
      amountInvested: dto.amount,
      roiPercentage: plan.roiPercentage,
      durationInDays: plan.durationInDays,
      startDate,
      maturityDate,
      status: InvestmentStatus.ACTIVE,
      expectedProfit,
    });

    await this.mailService.notifyAdminNewInvestment(user.email, plan.planName, dto.amount);

    await this.notificationsService.create(
      user._id.toString(),
      'Investment Created',
      `You invested $${dto.amount.toLocaleString()} in ${plan.planName}. It matures in ${plan.durationInDays} days.`,
      'investment',
    );

    return investment;
  }

  async findMyInvestments(userId: string, query: QueryInvestmentsDto) {
    return this.findAll(query, userId);
  }

  async findAllAdmin(query: QueryInvestmentsDto) {
    return this.findAll(query);
  }

  private async findAll(query: QueryInvestmentsDto, userId?: string) {
    const { page = 1, limit = 10, status } = query;
    const filter: Record<string, any> = {};
    if (userId) {
      // Explicit ObjectId cast here is the key fix.
      // Mongoose *should* auto-cast a string when the schema declares
      // `type: Types.ObjectId`, but if any stored documents have the user
      // field saved as a plain string (from earlier writes), this cast
      // ensures the *query* side is always a proper ObjectId — and then
      // the migration script below fixes the *stored* side.
      filter.user = new Types.ObjectId(userId);
    }

    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.investmentModel
        .find(filter)
        .populate({
          path: 'plan',
          select: 'planName roiPercentage durationInDays stock',
          populate: { path: 'stock', select: 'name ticker logoUrl currentPrice changePercent' },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.investmentModel.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string, isAdmin = false) {
    const investment = await this.investmentModel.findById(id).populate({
      path: 'plan',
      select: 'planName roiPercentage durationInDays stock',
      populate: { path: 'stock', select: 'name ticker logoUrl currentPrice changePercent' },
    });
    if (!investment) throw new NotFoundException('Investment not found');
    if (!isAdmin && investment.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this investment');
    }
    return investment;
  }

  // ---------- Admin: pause / resume ----------

  async pause(id: string) {
    const investment = await this.investmentModel.findById(id).populate('plan', 'planName');
    if (!investment) throw new NotFoundException('Investment not found');
    if (investment.status !== InvestmentStatus.ACTIVE) {
      throw new BadRequestException('Only active investments can be paused');
    }

    const remainingMs = Math.max(investment.maturityDate.getTime() - Date.now(), 0);
    investment.status = InvestmentStatus.PAUSED;
    investment.pausedAt = new Date();
    investment.pausedRemainingMs = remainingMs;
    await investment.save();

    const user = await this.userModel.findById(investment.user);
    const planName = (investment.plan as any)?.planName ?? 'your plan';
    if (user) {
      await this.mailService.sendInvestmentPausedEmail(user.email, user.fullName, planName);
      await this.notificationsService.create(
        user._id.toString(),
        'Investment Paused',
        `Your investment in ${planName} has been paused. The countdown to maturity is on hold.`,
        'investment',
      );
    }

    return investment;
  }

  async resume(id: string) {
    const investment = await this.investmentModel.findById(id).populate('plan', 'planName');
    if (!investment) throw new NotFoundException('Investment not found');
    if (investment.status !== InvestmentStatus.PAUSED) {
      throw new BadRequestException('Only paused investments can be resumed');
    }

    const remainingMs = investment.pausedRemainingMs ?? 0;
    investment.maturityDate = new Date(Date.now() + remainingMs);
    investment.status = InvestmentStatus.ACTIVE;
    investment.pausedAt = undefined;
    investment.pausedRemainingMs = undefined;
    await investment.save();

    const user = await this.userModel.findById(investment.user);
    const planName = (investment.plan as any)?.planName ?? 'your plan';
    if (user) {
      await this.mailService.sendInvestmentResumedEmail(user.email, user.fullName, planName);
      await this.notificationsService.create(
        user._id.toString(),
        'Investment Resumed',
        `Your investment in ${planName} has resumed counting down to maturity.`,
        'investment',
      );
    }

    return investment;
  }

  // ---------- Admin: cancel (refunds principal only — never matured) ----------

  async cancel(id: string) {
    const investment = await this.investmentModel.findById(id).populate('plan', 'planName');
    if (!investment) throw new NotFoundException('Investment not found');
    if (investment.status !== InvestmentStatus.ACTIVE && investment.status !== InvestmentStatus.PAUSED) {
      throw new BadRequestException('Only active or paused investments can be cancelled');
    }

    const user = await this.userModel.findById(investment.user);
    if (!user) throw new NotFoundException('User not found');

    user.balance += investment.amountInvested;
    await user.save();

    investment.status = InvestmentStatus.CANCELLED;
    await investment.save();

    const planName = (investment.plan as any)?.planName ?? 'your plan';

    await this.transactionModel.create({
      user: user._id,
      type: TransactionType.ADJUSTMENT,
      amount: investment.amountInvested,
      status: TransactionStatus.COMPLETED,
      reference: `CANCEL-${randomUUID()}`,
      description: `Investment in ${planName} cancelled — principal refunded`,
    });

    await this.mailService.sendInvestmentCancelledEmail(
      user.email,
      user.fullName,
      planName,
      investment.amountInvested,
    );
    await this.notificationsService.create(
      user._id.toString(),
      'Investment Cancelled',
      `Your investment in ${planName} was cancelled. $${investment.amountInvested.toLocaleString()} has been refunded to your balance.`,
      'investment',
    );

    return investment;
  }

  // ---------- Admin: backdate / adjust dates ----------

  async adjustDates(id: string, dto: AdjustInvestmentDatesDto) {
    const investment = await this.investmentModel.findById(id);
    if (!investment) throw new NotFoundException('Investment not found');

    if (dto.startDate) investment.startDate = new Date(dto.startDate);
    if (dto.maturityDate) investment.maturityDate = new Date(dto.maturityDate);

    if (investment.maturityDate <= investment.startDate) {
      throw new BadRequestException('Maturity date must be after the start date');
    }

    await investment.save();
    return investment;
  }
}