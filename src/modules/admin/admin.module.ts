import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { InvestmentPlan, InvestmentPlanSchema } from '../investment-plans/schemas/investment-plan.schema';
import { Deposit, DepositSchema } from '../deposits/schemas/deposit.schema';
import { Withdrawal, WithdrawalSchema } from '../withdrawals/schemas/withdrawal.schema';
import { AdminAuthController } from './admin.controller';
import { AdminAuthService } from './admin.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Investment.name, schema: InvestmentSchema },
      { name: InvestmentPlan.name, schema: InvestmentPlanSchema },
      { name: Deposit.name, schema: DepositSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as any },
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminDashboardController],
  providers: [AdminAuthService, AdminDashboardService],
})
export class AdminModule {}