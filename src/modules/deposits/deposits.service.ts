import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Deposit, DepositDocument } from './schemas/deposit.schema';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { ReviewDepositDto } from './dto/review-deposit.dto';
import { QueryDepositsDto } from './dto/query-deposits.dto';
import { DepositStatus, WalletStatus } from '../../common/enums/status.enum';
import { TransactionType, TransactionStatus } from '../../common/enums/transaction-type.enum';
import { MailService } from '../mail/mail.service';

@Injectable()     
export class DepositsService {
  constructor(
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private mailService: MailService,
  ) {}

  async create(userId: string, dto: CreateDepositDto) {
    const wallet = await this.walletModel.findById(dto.walletId);
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('This wallet is not currently active');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const deposit = await this.depositModel.create({
      user: user._id,
      wallet: wallet._id,
      coinName: wallet.coinName,
      network: wallet.network,
      amount: dto.amount,
      proofOfPayment: dto.proofUrl,
      status: DepositStatus.PENDING,
    });

    await this.mailService.notifyAdminNewDeposit(user.email, dto.amount);

    return deposit;
  }

  async findMyDeposits(userId: string, query: QueryDepositsDto) {
    return this.findAll(query, userId);
  }

  async findAllAdmin(query: QueryDepositsDto) {
    return this.findAll(query);
  }

  private async findAll(query: QueryDepositsDto, userId?: string) {
  const { page = 1, limit = 10, status } = query;
  const filter: Record<string, any> = {};

  if (userId) {
    filter.user = new Types.ObjectId(userId);
  }
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    this.depositModel
      .find(filter)
      .populate('user', 'fullName email balance')
      .populate('wallet', 'coinName network walletAddress qrCodeImage status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    this.depositModel.countDocuments(filter),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

  async findOne(userId: string, id: string, isAdmin = false) {
  const deposit = await this.depositModel
    .findById(id)
    .populate('user', 'fullName email balance')
    .populate('wallet', 'coinName network walletAddress qrCodeImage status');
  if (!deposit) throw new NotFoundException('Deposit not found');
  if (!isAdmin && deposit.user.toString() !== userId) {
    throw new ForbiddenException('You do not have access to this deposit');
  }
  return deposit;
}     

  async approve(id: string, adminId: string) {
    const deposit = await this.depositModel.findById(id);
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Only pending deposits can be approved');
    }

    const user = await this.userModel.findById(deposit.user);
    if (!user) throw new NotFoundException('User not found');

    user.balance += deposit.amount;
    await user.save();

    deposit.status = DepositStatus.APPROVED;
    deposit.reviewedBy = adminId as any;
    await deposit.save();

    await this.transactionModel.create({
      user: user._id,
      type: TransactionType.DEPOSIT,
      amount: deposit.amount,
      status: TransactionStatus.COMPLETED,
      reference: `DEP-${randomUUID()}`,
      description: `Deposit approved — ${deposit.coinName} (${deposit.network})`,
    });

    await this.mailService.sendDepositApprovedEmail(user.email, user.fullName, deposit.amount);

    return deposit;
  }

  async reject(id: string, adminId: string, dto: ReviewDepositDto) {
    const deposit = await this.depositModel.findById(id);
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Only pending deposits can be rejected');
    }

    deposit.status = DepositStatus.REJECTED;
    deposit.reviewedBy = adminId as any;
    deposit.adminNote = dto.adminNote;
    await deposit.save();

    const user = await this.userModel.findById(deposit.user);
    if (user) {
      await this.mailService.sendDepositRejectedEmail(user.email, user.fullName, deposit.amount, dto.adminNote);
    }

    return deposit;
  }
}    