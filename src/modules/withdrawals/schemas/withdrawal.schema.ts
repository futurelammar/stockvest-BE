import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WithdrawalStatus } from '../../../common/enums/status.enum';

export type WithdrawalDocument = Withdrawal & Document;

@Schema({ timestamps: true })
export class Withdrawal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  coinType: string;

  @Prop({ required: true })
  network: string;

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Prop()
  adminNote?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  paidAt?: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);