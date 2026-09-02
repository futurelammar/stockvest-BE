import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType, TransactionStatus } from '../../../common/enums/transaction-type.enum';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.COMPLETED })
  status: TransactionStatus;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ type: Types.ObjectId, refPath: 'sourceModel' })
    sourceId?: Types.ObjectId;
  
  @Prop({ type: String, enum: ['Deposit', 'Investment', 'Withdrawal'] })
    sourceModel?: string;

  @Prop()
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);