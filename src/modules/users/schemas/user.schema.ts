import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';
import * as bcrypt from 'bcrypt';

export interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<User> & UserMethods;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  totalInvested: number;

  @Prop({ default: 0 })
  totalProfit: number;

  @Prop()
  phone?: string;

  @Prop()
  profilePhoto?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  blockedReason?: string;

  @Prop()
  blockedAt?: Date;

  @Prop({ default: false })
  withdrawalsBlocked: boolean;

  @Prop()
  withdrawalsBlockedReason?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  lastVerificationSentAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (this: UserDocument) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};