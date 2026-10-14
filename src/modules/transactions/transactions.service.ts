import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateUserTotalsDto } from './dto/update-user-totals.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    // Inject User so getSummary can read the denormalised running totals
    // that InvestmentsService keeps on the user document.
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findMine(userId: string, query: QueryTransactionsDto) {
    return this.findAll(query, userId);
  }

  async findAllAdmin(query: QueryTransactionsDto) {
    return this.findAll(query);
  }

  private async findAll(query: QueryTransactionsDto, userId?: string) {
    const { page = 1, limit = 10, type, status } = query;
    const filter: Record<string, any> = {};

    if (userId) {
      filter.user = new Types.ObjectId(userId);
    }
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('user', 'fullName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.transactionModel.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string, isAdmin = false) {
    const transaction = await this.transactionModel.findById(id).populate('user', 'fullName email');
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (!isAdmin && transaction.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }
    return transaction;
  }

  /** Sum of completed transactions of one type for one user (the "real" figure). */
  private async sumCompleted(userId: string, type: 'deposit' | 'withdrawal'): Promise<number> {
    const result = await this.transactionModel.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          type,
          status: 'completed',
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  /**
   * Dashboard wallet summary.
   *
   * • totalDeposited  → completed 'deposit' transactions + admin adjustment
   * • totalWithdrawn  → completed 'withdrawal' transactions + admin adjustment
   * • totalInvested   → user.totalInvested (maintained by InvestmentsService, admin-editable)
   * • totalProfit     → user.totalProfit   (maintained by InvestmentsService, admin-editable)
   *
   * The deposited / withdrawn adjustments are stored as offsets, so real
   * deposits and withdrawals made after an admin edit keep counting up.
   */
  async getSummary(userId: string) {
    const [deposited, withdrawn, user] = await Promise.all([
      this.sumCompleted(userId, 'deposit'),
      this.sumCompleted(userId, 'withdrawal'),
      this.userModel
        .findById(userId)
        .select('totalInvested totalProfit depositedAdjustment withdrawnAdjustment')
        .lean(),
    ]);

    return {
      totalDeposited: Math.max(0, deposited + (user?.depositedAdjustment ?? 0)),
      totalWithdrawn: Math.max(0, withdrawn + (user?.withdrawnAdjustment ?? 0)),
      totalInvested: user?.totalInvested ?? 0,
      totalProfit: user?.totalProfit ?? 0,
    };
  }

  /**
   * Admin: set any of a user's dashboard totals to an exact value.
   * Returns the resulting summary, which is exactly what the user sees.
   */
  async setUserTotals(userId: string, adminId: string, dto: UpdateUserTotalsDto) {
    const { totalDeposited, totalWithdrawn, totalInvested, totalProfit, reason } = dto;

    if ([totalDeposited, totalWithdrawn, totalInvested, totalProfit].every((v) => v === undefined)) {
      throw new BadRequestException('Provide at least one total to update');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (totalInvested !== undefined) user.totalInvested = totalInvested;
    if (totalProfit !== undefined) user.totalProfit = totalProfit;

    if (totalDeposited !== undefined) {
      const real = await this.sumCompleted(userId, 'deposit');
      user.depositedAdjustment = totalDeposited - real;
    }
    if (totalWithdrawn !== undefined) {
      const real = await this.sumCompleted(userId, 'withdrawal');
      user.withdrawnAdjustment = totalWithdrawn - real;
    }

    await user.save();

    this.logger.log(
      `Admin ${adminId} edited totals for user ${userId}: ${JSON.stringify({
        totalDeposited,
        totalWithdrawn,
        totalInvested,
        totalProfit,
      })} — reason: ${reason}`,
    );

    return this.getSummary(userId);
  }
}