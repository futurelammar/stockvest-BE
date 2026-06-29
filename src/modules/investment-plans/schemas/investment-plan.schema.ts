import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlanStatus } from '../../../common/enums/status.enum';

export type InvestmentPlanDocument = InvestmentPlan & Document;

@Schema({ timestamps: true })
export class InvestmentPlan {
  @Prop({ required: true, trim: true })
  planName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Stock', required: true })
  stock: Types.ObjectId;

  @Prop({ required: true })
  durationInDays: number;

  @Prop({ required: true })
  roiPercentage: number;

  @Prop({ required: true })
  minimumInvestment: number;

  @Prop({ required: true })
  maximumInvestment: number;

  @Prop({ enum: PlanStatus, default: PlanStatus.ACTIVE })
  status: PlanStatus;

  @Prop()
  featuredImage?: string;
}

export const InvestmentPlanSchema = SchemaFactory.createForClass(InvestmentPlan);