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
      // Bearer header now checked FIRST. An explicit Authorization header is
      // a deliberate signal from the client (e.g. the admin panel) — it should
      // always win over an ambient cookie that might just be leftover from a
      // different session (e.g. a regular user logged in earlier in the same browser).
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Account no longer exists');
    if (!user.isActive) throw new UnauthorizedException('This account has been suspended');

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}