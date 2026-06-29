import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.userModel.create({
      ...dto,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastVerificationSentAt: new Date(),
    });

    await this.mailService.sendWelcomeEmail(user.email, user.fullName);
    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'Registration successful. Please check your email to verify your account before logging in.',
      email: user.email,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) return null;
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return null;
    return user;
  }

  async login(user: UserDocument) {
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }
    if (!user.isActive) {
      throw new ForbiddenException('This account has been suspended. Please contact support.');
    }
    return this.buildAuthResponse(user);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userModel.findOne({
      emailVerificationToken: dto.token,
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Token is invalid or expired');

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new NotFoundException('No account with that email');
    if (user.isEmailVerified) throw new BadRequestException('Email is already verified');

    const COOLDOWN_MS = 60 * 1000;
    if (user.lastVerificationSentAt) {
      const secondsLeft = Math.ceil(
        (COOLDOWN_MS - (Date.now() - user.lastVerificationSentAt.getTime())) / 1000,
      );
      if (secondsLeft > 0) {
        throw new BadRequestException(`Please wait ${secondsLeft}s before requesting another email`);
      }
    }

    const verificationToken = randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await user.save();

    await this.mailService.sendVerificationEmail(user.email, verificationToken);
    return { message: 'Verification email resent' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new NotFoundException('No account with that email');

    const token = randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await this.mailService.sendPasswordResetEmail(user.email, token);
    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      passwordResetToken: dto.token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) throw new UnauthorizedException('Token is invalid or expired');

    user.password = dto.newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  }

  private buildAuthResponse(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        balance: user.balance,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}