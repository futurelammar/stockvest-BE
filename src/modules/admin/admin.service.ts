import {
  Injectable,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { AdminSetupDto } from './dto/admin-setup.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()     
export class AdminAuthService {
  constructor(               
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async setup(dto: AdminSetupDto) {
    const existingAdminCount = await this.userModel.countDocuments({ role: Role.ADMIN });
    if (existingAdminCount > 0) {
      throw new ForbiddenException(
        'Admin setup has already been completed. Ask an existing admin to create your account.',
      );
    }

    const expectedSecret = this.configService.getOrThrow<string>('ADMIN_SETUP_SECRET');
    if (dto.setupSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid setup secret');
    }

    const existingEmail = await this.userModel.findOne({ email: dto.email });
    if (existingEmail) throw new ConflictException('Email already registered');

    const admin = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
      role: Role.ADMIN,
      isEmailVerified: true, // bootstrap action, trusted by definition
    });

    return this.buildAuthResponse(admin);
  }

  async createAdmin(dto: CreateAdminDto) {
    const existingEmail = await this.userModel.findOne({ email: dto.email });
    if (existingEmail) throw new ConflictException('Email already registered');

    const admin = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
      role: Role.ADMIN,
      isEmailVerified: true,
    });

    return {
      message: 'Admin account created successfully',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async login(dto: AdminLoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).select('+password');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('This login is for admin accounts only');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated');
    }

    return this.buildAuthResponse(user);
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
      },
    };
  }
}