import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Deposit, DepositSchema } from './schemas/deposit.schema';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { CloudinaryModule } from '../../uploads/uploads.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deposit.name, schema: DepositSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    CloudinaryModule,
    MailModule,
    NotificationsModule,
  ],
  controllers: [DepositsController, WalletsController],
  providers: [DepositsService, WalletsService],
  exports: [DepositsService, WalletsService],
})
export class DepositsModule {}