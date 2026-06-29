import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
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
      // Explicit ObjectId cast — same fix applied to Withdrawals and Investments.
      // Ensures the query side always matches regardless of how the user field
      // was originally stored on any given document.
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

  // Quick wallet summary for dashboard — total in vs total out
  async getSummary(userId: string) {
    const [deposits, withdrawals, investments, profits] = await Promise.all([
      this.sumByType(userId, 'deposit'),
      this.sumByType(userId, 'withdrawal'),
      this.sumByType(userId, 'investment'),
      this.sumByType(userId, 'profit'),
    ]);

    return { totalDeposited: deposits, totalWithdrawn: withdrawals, totalInvested: investments, totalProfit: profits };
  }

  private async sumByType(userId: string, type: string) {
    const result = await this.transactionModel.aggregate([
      { $match: { user: new Types.ObjectId(userId), type, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }
}