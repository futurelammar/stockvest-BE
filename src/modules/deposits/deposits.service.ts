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
import { EditDepositDto } from './dto/edit-deposit.dto';

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
      sourceId: deposit._id,
      sourceModel: 'Deposit',
      createdAt: deposit.createdAt, // keep transaction date in sync with the deposit's own date at approval time
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



 async edit(id: string, dto: EditDepositDto) {
  const deposit = await this.depositModel.findById(id);
  if (!deposit) throw new NotFoundException('Deposit not found');

  console.log('[edit] deposit found:', deposit._id.toString(), 'status:', deposit.status);
  console.log('[edit] incoming dto:', JSON.stringify(dto));

  if (dto.amount !== undefined) deposit.amount = dto.amount;
  if (dto.coinName !== undefined) deposit.coinName = dto.coinName;
  if (dto.network !== undefined) deposit.network = dto.network;
  await deposit.save();

  // createdAt is auto-marked immutable by Mongoose's timestamps plugin,
  // so the document setter silently ignores it — bypass Mongoose via
  // the native driver to force the write through.
  if (dto.createdAt !== undefined) {
    const depositUpdateResult = await this.depositModel.collection.updateOne(
      { _id: deposit._id },
      { $set: { createdAt: new Date(dto.createdAt) } },
    );
    console.log(
      '[edit] deposit.createdAt raw update — matched:', depositUpdateResult.matchedCount,
      'modified:', depositUpdateResult.modifiedCount,
    );
    (deposit as any).createdAt = new Date(dto.createdAt); // reflect it on the in-memory doc we return
  }

  // Keep the linked transaction (and, if approved, the user's balance) in sync
  if (deposit.status === DepositStatus.APPROVED) {
    console.log('[edit] deposit is APPROVED — looking for linked transaction');

    let transaction = await this.transactionModel.findOne({
      sourceId: deposit._id,
      sourceModel: 'Deposit',
    });

    console.log('[edit] direct sourceId lookup result:', transaction?._id?.toString() ?? 'NOT FOUND');

    // Fallback for transactions created before sourceId linkage existed
    if (!transaction) {
      transaction = await this.transactionModel.findOne({
        user: deposit.user,
        type: TransactionType.DEPOSIT,
        amount: deposit.amount,
        sourceId: { $exists: false },
      });
      console.log('[edit] fallback lookup result:', transaction?._id?.toString() ?? 'STILL NOT FOUND');

      if (transaction) {
        await this.transactionModel.collection.updateOne(
          { _id: transaction._id },
          { $set: { sourceId: deposit._id, sourceModel: 'Deposit' } },
        );
        console.log('[edit] backfilled sourceId onto transaction:', transaction._id.toString());
      }
    }

    if (transaction) {
      console.log('[edit] syncing transaction', transaction._id.toString(), 'current createdAt:', transaction.createdAt);

      if (dto.createdAt !== undefined) {
        const txUpdateResult = await this.transactionModel.collection.updateOne(
          { _id: transaction._id },
          { $set: { createdAt: new Date(dto.createdAt) } },
        );
        console.log(
          '[edit] transaction.createdAt raw update — matched:', txUpdateResult.matchedCount,
          'modified:', txUpdateResult.modifiedCount,
          'newValue:', new Date(dto.createdAt).toISOString(),
        );
      }

      if (dto.amount !== undefined && dto.amount !== transaction.amount) {
        const user = await this.userModel.findById(deposit.user);
        if (user) {
          const delta = dto.amount - transaction.amount;
          user.balance += delta;
          await user.save();
          console.log('[edit] balance adjusted by delta:', delta, 'new balance:', user.balance);
        }
        transaction.amount = dto.amount;
        await transaction.save();
        console.log('[edit] transaction.amount updated to:', dto.amount);
      }
    } else {
      console.log('[edit] NO TRANSACTION FOUND — nothing was synced for this deposit');
    }
  } else {
    console.log('[edit] deposit is NOT approved — skipping transaction sync entirely');
  }

  console.log('[edit] returning deposit with createdAt:', (deposit as any).createdAt);
  return deposit;
}
}    


