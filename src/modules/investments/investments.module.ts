import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Investment, InvestmentSchema } from './schemas/investment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { InvestmentsCron } from './investments.cron';
import { InvestmentPlansModule } from '../investment-plans/investment-plans.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    InvestmentPlansModule,
    MailModule,
    NotificationsModule, 
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, InvestmentsCron],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}