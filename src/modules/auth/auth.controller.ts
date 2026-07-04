import { Body, Controller, Post, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import ms from 'ms';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,     
    private configService: ConfigService,     
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user);
    this.setAuthCookie(res, result.accessToken);
    return { user: result.user };
  }

@Post('logout')
logout(@Res({ passthrough: true }) res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  return { message: 'Logged out' };
}

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email using token sent to user inbox' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private setAuthCookie(res: Response, token: string) {
  const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';
  const maxAge = ms(expiresIn as ms.StringValue);
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isProd,                       // must be true whenever sameSite is 'none'
    sameSite: isProd ? 'none' : 'lax',    // 'none' required for cross-site in prod
    maxAge: maxAge ?? ms('1d'),
    path: '/',
  });
}
}