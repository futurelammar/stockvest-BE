import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin.service';
import { AdminSetupDto } from './dto/admin-setup.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('setup')
  @ApiOperation({ summary: 'One-time bootstrap — create the first admin (requires setup secret)' })
  setup(@Body() dto: AdminSetupDto) {
    return this.adminAuthService.setup(dto);
  }

  @Post('register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin only] Create another admin account' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminAuthService.createAdmin(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Admin login (rejects non-admin accounts)' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }
}