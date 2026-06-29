import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  welcomeTemplate,
  passwordResetTemplate,
  emailVerificationTemplate,
  depositApprovedTemplate,
  depositAdminNotificationTemplate,
  depositRejectedTemplate,
  withdrawalApprovedTemplate,
  withdrawalAdminNotificationTemplate,
  withdrawalRejectedTemplate,
  investmentAdminNotificationTemplate,
  investmentMaturedTemplate,
  accountBlockedTemplate,
  accountUnblockedTemplate,
  withdrawalsBlockedTemplate,
  withdrawalsUnblockedTemplate,
  balanceAdjustedTemplate,
  investmentCancelledTemplate,
  investmentPausedTemplate,
  investmentResumedTemplate,
} from './templates/email.templates';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;
  private adminEmail: string;
  private clientUrl: string;
  private logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
    this.fromEmail = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL');
    this.adminEmail = this.configService.getOrThrow<string>('ADMIN_EMAIL');
    this.clientUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({ from: this.fromEmail, to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    await this.send(email, 'Welcome to the Platform', welcomeTemplate(fullName));
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.clientUrl}/verify-email?token=${token}`;
    await this.send(email, 'Verify Your Email', emailVerificationTemplate(verifyUrl));
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.clientUrl}/reset-password?token=${token}`;
    await this.send(email, 'Reset Your Password', passwordResetTemplate(resetUrl));
  }

  async sendDepositApprovedEmail(email: string, fullName: string, amount: number) {
    await this.send(email, 'Deposit Approved', depositApprovedTemplate(fullName, amount));
  }

  async sendDepositRejectedEmail(email: string, fullName: string, amount: number, reason?: string) {
    await this.send(email, 'Deposit Rejected', depositRejectedTemplate(fullName, amount, reason));
  }

  async notifyAdminNewDeposit(userEmail: string, amount: number) {
    await this.send(this.adminEmail, 'New Deposit Request', depositAdminNotificationTemplate(userEmail, amount));
  }

  async sendWithdrawalApprovedEmail(email: string, fullName: string, amount: number) {
    await this.send(email, 'Withdrawal Approved', withdrawalApprovedTemplate(fullName, amount));
  }

  async sendWithdrawalRejectedEmail(email: string, fullName: string, amount: number, reason?: string) {
    await this.send(email, 'Withdrawal Rejected', withdrawalRejectedTemplate(fullName, amount, reason));
  }

  async notifyAdminNewWithdrawal(userEmail: string, amount: number) {
    await this.send(this.adminEmail, 'New Withdrawal Request', withdrawalAdminNotificationTemplate(userEmail, amount));
  }

  async notifyAdminNewInvestment(userEmail: string, planName: string, amount: number) {
    await this.send(
      this.adminEmail,
      'New Investment Created',
      investmentAdminNotificationTemplate(userEmail, planName, amount),
    );
  }

  async sendInvestmentMaturedEmail(email: string, fullName: string, planName: string, profit: number) {
    await this.send(email, 'Investment Matured', investmentMaturedTemplate(fullName, planName, profit));
  }

  async sendAccountBlockedEmail(email: string, fullName: string, reason?: string) {
    await this.send(email, 'Account Suspended', accountBlockedTemplate(fullName, reason));
  }

  async sendAccountUnblockedEmail(email: string, fullName: string) {
    await this.send(email, 'Account Reinstated', accountUnblockedTemplate(fullName));
  }

  async sendWithdrawalsBlockedEmail(email: string, fullName: string, reason?: string) {
    await this.send(email, 'Withdrawals Restricted', withdrawalsBlockedTemplate(fullName, reason));
  }

  async sendWithdrawalsUnblockedEmail(email: string, fullName: string) {
    await this.send(email, 'Withdrawals Restored', withdrawalsUnblockedTemplate(fullName));
  }

  async sendBalanceAdjustedEmail(email: string, fullName: string, amount: number, reason: string) {
    await this.send(email, 'Balance Adjusted', balanceAdjustedTemplate(fullName, amount, reason));
  }

  async sendInvestmentCancelledEmail(email: string, fullName: string, planName: string, refundAmount: number) {
    await this.send(email, 'Investment Cancelled', investmentCancelledTemplate(fullName, planName, refundAmount));
  }

  async sendInvestmentPausedEmail(email: string, fullName: string, planName: string) {
    await this.send(email, 'Investment Paused', investmentPausedTemplate(fullName, planName));
  }

  async sendInvestmentResumedEmail(email: string, fullName: string, planName: string) {
    await this.send(email, 'Investment Resumed', investmentResumedTemplate(fullName, planName));
  }
}