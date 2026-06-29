import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../../users/schemas/user.schema';

const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.access_token || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    // One extra DB read per authenticated request — totally fine at this scale,
    // and means a blocked/deleted user's existing token stops working immediately
    // instead of staying valid until it naturally expires.
    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Account no longer exists');
    if (!user.isActive) throw new UnauthorizedException('This account has been suspended');

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}