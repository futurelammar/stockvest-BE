import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Withdrawal, WithdrawalDocument } from './schemas/withdrawal.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';
import { WithdrawalStatus } from '../../common/enums/status.enum';
import { TransactionType, TransactionStatus } from '../../common/enums/transaction-type.enum';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<WithdrawalDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateWithdrawalDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.withdrawalsBlocked) {
      throw new ForbiddenException(
        user.withdrawalsBlockedReason
          ? `Withdrawals are currently restricted on your account: ${user.withdrawalsBlockedReason}`
          : 'Withdrawals are currently restricted on your account. Please contact support.',
      );
    }

    if (user.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance for this withdrawal');
    }

    user.balance -= dto.amount;
    await user.save();

    const withdrawal = await this.withdrawalModel.create({
      user: user._id,
      coinType: dto.coinType,
      network: dto.network,
      walletAddress: dto.walletAddress,
      amount: dto.amount,
      status: WithdrawalStatus.PENDING,
    });

    await this.mailService.notifyAdminNewWithdrawal(user.email, dto.amount);

    return withdrawal;
  }

  async findMyWithdrawals(userId: string, query: QueryWithdrawalsDto) {
    return this.findAll(query, userId);
  }

  async findAllAdmin(query: QueryWithdrawalsDto) {
    return this.findAll(query);
  }

  private async findAll(query: QueryWithdrawalsDto, userId?: string) {
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
  this.withdrawalModel
    .find(filter)
    .populate('user', 'fullName email balance')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }),
  this.withdrawalModel.countDocuments(filter),
]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string, isAdmin = false) {
    const withdrawal = await this.withdrawalModel.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (!isAdmin && withdrawal.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this withdrawal');
    }
    return withdrawal;
  }

  async approve(id: string, adminId: string) {
    const withdrawal = await this.withdrawalModel.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be approved');
    }

    withdrawal.status = WithdrawalStatus.APPROVED;
    withdrawal.reviewedBy = adminId as any;
    await withdrawal.save();

    const user = await this.userModel.findById(withdrawal.user);
    if (user) {
      await this.mailService.sendWithdrawalApprovedEmail(user.email, user.fullName, withdrawal.amount);
      await this.notificationsService.create(
        user._id.toString(),
        'Withdrawal Approved',
        `Your withdrawal of $${withdrawal.amount.toLocaleString()} has been approved.`,
        'withdrawal',
      );
    }

    return withdrawal;
  }

  async reject(id: string, adminId: string, dto: ReviewWithdrawalDto) {
    const withdrawal = await this.withdrawalModel.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be rejected');
    }

    const user = await this.userModel.findById(withdrawal.user);
    if (user) {
      user.balance += withdrawal.amount;
      await user.save();

      await this.transactionModel.create({
        user: user._id,
        type: TransactionType.WITHDRAWAL,
        amount: withdrawal.amount,
        status: TransactionStatus.FAILED,
        reference: `WDR-REFUND-${randomUUID()}`,
        description: 'Withdrawal rejected — amount refunded to balance',
      });

      await this.mailService.sendWithdrawalRejectedEmail(user.email, user.fullName, withdrawal.amount, dto.adminNote);
      await this.notificationsService.create(
        user._id.toString(),
        'Withdrawal Rejected',
        `Your withdrawal of $${withdrawal.amount.toLocaleString()} was rejected and refunded to your balance.${dto.adminNote ? ` Reason: ${dto.adminNote}` : ''}`,
        'withdrawal',
      );
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.reviewedBy = adminId as any;
    withdrawal.adminNote = dto.adminNote;
    await withdrawal.save();

    return withdrawal;
  }

  async markAsPaid(id: string) {
    const withdrawal = await this.withdrawalModel.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== WithdrawalStatus.APPROVED) {
      throw new BadRequestException('Only approved withdrawals can be marked as paid');
    }

    withdrawal.status = WithdrawalStatus.PAID;
    withdrawal.paidAt = new Date();
    await withdrawal.save();

    const user = await this.userModel.findById(withdrawal.user);
    if (user) {
      await this.transactionModel.create({
        user: user._id,
        type: TransactionType.WITHDRAWAL,
        amount: withdrawal.amount,
        status: TransactionStatus.COMPLETED,
        reference: `WDR-${randomUUID()}`,
        description: `Withdrawal paid — ${withdrawal.coinType} (${withdrawal.network})`,
      });

      await this.notificationsService.create(
        user._id.toString(),
        'Withdrawal Paid',
        `Your withdrawal of $${withdrawal.amount.toLocaleString()} has been sent.`,
        'withdrawal',
      );
    }

    return withdrawal;
  }
}