import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentPlan, InvestmentPlanSchema } from './schemas/investment-plan.schema';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { InvestmentPlansController } from './investment-plans.controller';
import { InvestmentPlansService } from './investment-plans.service';
import { CloudinaryModule } from '../../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvestmentPlan.name, schema: InvestmentPlanSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [InvestmentPlansController],
  providers: [InvestmentPlansService],
  exports: [InvestmentPlansService],
})
export class InvestmentPlansModule {}