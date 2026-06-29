import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WalletStatus } from '../../../common/enums/status.enum';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true })
  coinName: string;

  @Prop({ required: true })
  network: string;

  @Prop({ required: true })
  walletAddress: string;

  @Prop()
  qrCodeImage?: string;

  @Prop({ enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);