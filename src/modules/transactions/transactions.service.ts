import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionsService {
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

  /**
   * Dashboard wallet summary.
   *
   * WHY the old approach was wrong:
   * ─────────────────────────────────
   * The original code called sumByType(userId, 'investment') and
   * sumByType(userId, 'profit'), expecting Transaction documents of those
   * types to exist. But InvestmentsService.create() never writes an
   * 'investment' transaction — it deducts balance and increments
   * user.totalInvested directly on the User document.
   *
   * So the aggregate always returned 0 for totalInvested.
   *
   * FIX:
   * ────
   * • totalDeposited  → aggregate completed 'deposit' transactions  ✓ (correct source)
   * • totalWithdrawn  → aggregate completed 'withdrawal' transactions ✓ (correct source)
   * • totalInvested   → read user.totalInvested (maintained by InvestmentsService) ✓
   * • totalProfit     → read user.totalProfit   (maintained by InvestmentsService) ✓
   */
  async getSummary(userId: string) {
    const [depositsResult, withdrawalsResult, user] = await Promise.all([
      // Deposits: real transaction records exist for these
      this.transactionModel.aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            type: 'deposit',
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Withdrawals: real transaction records exist for these
      this.transactionModel.aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            type: 'withdrawal',
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // User document carries the running totals for invested & profit
      // because InvestmentsService updates them directly on save().
      this.userModel.findById(userId).select('totalInvested totalProfit').lean(),
    ]);

    return {
      totalDeposited: depositsResult[0]?.total ?? 0,
      totalWithdrawn: withdrawalsResult[0]?.total ?? 0,
      totalInvested:  user?.totalInvested ?? 0,
      totalProfit:    user?.totalProfit   ?? 0,
    };
  }
}