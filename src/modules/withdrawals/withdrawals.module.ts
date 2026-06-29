import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    MailModule,
    NotificationsModule,
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}