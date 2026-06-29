import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { Investment, InvestmentDocument } from './schemas/investment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { InvestmentStatus } from '../../common/enums/status.enum';
import { TransactionType, TransactionStatus } from '../../common/enums/transaction-type.enum';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvestmentsCron {
  private logger = new Logger(InvestmentsCron.name);

  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleMaturedInvestments() {
     this.logger.log('Cron tick: checking for matured investments...');
    const now = new Date();
    const matured = await this.investmentModel
      .find({ status: InvestmentStatus.ACTIVE, maturityDate: { $lte: now }, profitCredited: false })
      .populate('plan', 'planName');

        this.logger.log(`Found ${matured.length} matured investment(s)`);

    if (matured.length === 0) return;

    this.logger.log(`Processing ${matured.length} matured investment(s)`);

    for (const investment of matured) {
      try {
        const user = await this.userModel.findById(investment.user);
        if (!user) continue;

        const payout = investment.amountInvested + investment.expectedProfit;
        user.balance += payout;
        user.totalProfit += investment.expectedProfit;
        await user.save();

        investment.status = InvestmentStatus.COMPLETED;
        investment.profitCredited = true;
        await investment.save();

        await this.transactionModel.create({
          user: user._id,
          type: TransactionType.PROFIT,
          amount: payout,
          status: TransactionStatus.COMPLETED,
          reference: `PROFIT-${randomUUID()}`,
          description: 'Investment matured — principal and profit credited',
        });

        const planName = (investment.plan as any)?.planName || 'Investment Plan';
        await this.mailService.sendInvestmentMaturedEmail(
          user.email,
          user.fullName,
          planName,
          investment.expectedProfit,
        );

        await this.notificationsService.create(
  user._id.toString(),
  'Investment Matured',
  `Your investment in ${planName} matured. $${payout.toLocaleString()} (principal + profit) has been credited to your balance.`,
  'investment',
);
      } catch (error) {
        this.logger.error(`Failed to process matured investment ${investment._id}: ${error.message}`);
      }
    }
  }
}