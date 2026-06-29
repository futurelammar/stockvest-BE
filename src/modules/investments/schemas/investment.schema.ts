import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InvestmentStatus } from '../../../common/enums/status.enum';

export type InvestmentDocument = Investment & Document;

@Schema({ timestamps: true })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InvestmentPlan', required: true })
  plan: Types.ObjectId;

  @Prop({ required: true })
  amountInvested: number;

  @Prop({ required: true })
  roiPercentage: number;

  @Prop({ required: true })
  durationInDays: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  maturityDate: Date;

  @Prop({ enum: InvestmentStatus, default: InvestmentStatus.ACTIVE })
  status: InvestmentStatus;

  @Prop({ default: 0 })
  expectedProfit: number;

  @Prop({ default: false })
  profitCredited: boolean;

  @Prop()
  pausedAt?: Date;

  @Prop()
  pausedRemainingMs?: number;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);