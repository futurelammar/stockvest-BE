import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  changePassword(@CurrentUser('userId') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Patch('me/photo')
  @ApiOperation({ summary: 'Upload/update profile photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  updateProfilePhoto(
    @CurrentUser('userId') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateProfilePhoto(userId, file);
  }

  // ---------- Admin ----------

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all users — pagination, search, filter' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Get a single user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Update a user role or active status' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin][Legacy] Deactivate a user — prefer /admin/:id/block' })
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Patch('admin/:id/block')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Block a user — now actually prevents login' })
  blockUser(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.usersService.blockUser(id, dto);
  }

  @Patch('admin/:id/unblock')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Unblock a user' })
  unblockUser(@Param('id') id: string) {
    return this.usersService.unblockUser(id);
  }

  @Patch('admin/:id/block-withdrawals')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Block withdrawal requests for a user without blocking the account' })
  blockWithdrawals(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.usersService.blockWithdrawals(id, dto);
  }

  @Patch('admin/:id/unblock-withdrawals')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Restore withdrawal access for a user' })
  unblockWithdrawals(@Param('id') id: string) {
    return this.usersService.unblockWithdrawals(id);
  }

  @Patch('admin/:id/adjust-balance')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Manually credit or debit a user balance, with a reason' })
  adjustBalance(@Param('id') id: string, @Body() dto: AdjustBalanceDto) {
    return this.usersService.adjustBalance(id, dto);
  }
}