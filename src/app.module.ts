import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InvestmentPlansModule } from './modules/investment-plans/investment-plans.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';
import { CloudinaryModule } from './uploads/uploads.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { StocksModule } from './modules/stocks/stocks.module';

@Module({     
  imports: [
     ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({    
      useFactory: () => ({ uri: process.env.MONGO_URI }),
    }),
    ScheduleModule.forRoot(),
    AuthModule, UsersModule, InvestmentPlansModule, InvestmentsModule, DepositsModule, WithdrawalsModule, TransactionsModule, AdminModule, SettingsModule, NotificationsModule, MailModule, CloudinaryModule, StocksModule],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
