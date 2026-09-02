import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DepositStatus } from '../../../common/enums/status.enum';

export type DepositDocument = Deposit & Document;

@Schema({ timestamps: true })
export class Deposit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  wallet: Types.ObjectId;

  @Prop({ required: true })
  coinName: string;

  @Prop({ required: true })
  network: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  proofOfPayment: string;

  @Prop({ enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @Prop()
  adminNote?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  createdAt?: Date;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);