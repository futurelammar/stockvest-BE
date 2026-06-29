import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { StockStatus } from '../../../common/enums/status.enum';

export type StockDocument = HydratedDocument<Stock>;

@Schema({ timestamps: true })
export class Stock {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  ticker: string;

  @Prop()
  logoUrl?: string;

  @Prop({ default: 'General' })
  sector?: string;

  @Prop({ required: true, default: 0 })
  currentPrice: number;

  @Prop({ default: 0 })
  previousClose: number;

  @Prop({ default: 0 })
  changePercent: number;

  @Prop({ default: false })
  isCustom: boolean;

  @Prop({ enum: StockStatus, default: StockStatus.ACTIVE })
  status: StockStatus;

  @Prop()
  lastSyncedAt?: Date;
}

export const StockSchema = SchemaFactory.createForClass(Stock);