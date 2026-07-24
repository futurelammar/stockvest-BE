import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { CloudinaryService } from '../../uploads/cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransactionType, TransactionStatus } from '../../common/enums/transaction-type.enum';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private cloudinaryService: CloudinaryService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(userId, dto, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const result = await this.cloudinaryService.uploadImage(file, 'profile-photos');
    user.profilePhoto = result.secure_url;
    await user.save();

    return { profilePhoto: user.profilePhoto };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await user.comparePassword(dto.currentPassword);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    user.password = dto.newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // ---------- Admin: listing ----------

 async findAll(query: QueryUsersDto) {
  const { page = 1, limit = 10, search, isActive } = query;

  // Always scope to regular users only — admins are never visible
  // in the user management list regardless of other filters
  const filter: Record<string, any> = { role: Role.USER };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (typeof isActive === 'boolean') filter.isActive = isActive;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.userModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    this.userModel.countDocuments(filter),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
     
  async findOne(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deactivateUser(id: string) {
    // Legacy endpoint — kept for backward compatibility. Prefer blockUser() below,
    // which also sends notifications and is now actually enforced at login/auth.
    const user = await this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }


  async deleteUser(id: string) {
  const user = await this.userModel.findById(id);
  if (!user) throw new NotFoundException('User not found');

  // Prevent deleting admin accounts through this endpoint —
  // admins can only be removed directly from the database
  if (user.role === Role.ADMIN) {
    throw new BadRequestException('Admin accounts cannot be deleted through this endpoint');
  }

  await this.userModel.findByIdAndDelete(id);
  return { message: 'User deleted permanently' };
}

  // ---------- Admin: block / unblock account ----------

  async blockUser(id: string, dto: BlockUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isActive) throw new BadRequestException('This user is already blocked');

    user.isActive = false;
    user.blockedReason = dto.reason;
    user.blockedAt = new Date();
    await user.save();

    await this.mailService.sendAccountBlockedEmail(user.email, user.fullName, dto.reason);
    await this.notificationsService.create(
      user._id.toString(),
      'Account Suspended',
      `Your account has been suspended.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
      'account',
    );

    return user;
  }

  async unblockUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) throw new BadRequestException('This user is not blocked');

    user.isActive = true;
    user.blockedReason = undefined;
    user.blockedAt = undefined;
    await user.save();

    await this.mailService.sendAccountUnblockedEmail(user.email, user.fullName);
    await this.notificationsService.create(
      user._id.toString(),
      'Account Reinstated',
      'Your account has been reinstated. You can now log in as normal.',
      'account',
    );

    return user;
  }

  // ---------- Admin: block / unblock withdrawals only ----------

  async blockWithdrawals(id: string, dto: BlockUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.withdrawalsBlocked) throw new BadRequestException('Withdrawals are already blocked for this user');

    user.withdrawalsBlocked = true;
    user.withdrawalsBlockedReason = dto.reason;
    await user.save();

    await this.mailService.sendWithdrawalsBlockedEmail(user.email, user.fullName, dto.reason);
    await this.notificationsService.create(
      user._id.toString(),
      'Withdrawals Restricted',
      `Your ability to request withdrawals has been restricted.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
      'account',
    );

    return user;
  }

  async unblockWithdrawals(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.withdrawalsBlocked) throw new BadRequestException('Withdrawals are not blocked for this user');

    user.withdrawalsBlocked = false;
    user.withdrawalsBlockedReason = undefined;
    await user.save();

    await this.mailService.sendWithdrawalsUnblockedEmail(user.email, user.fullName);
    await this.notificationsService.create(
      user._id.toString(),
      'Withdrawals Restored',
      'You can now request withdrawals again.',
      'account',
    );

    return user;
  }

  // ---------- Admin: manual balance adjustment ----------

  async adjustBalance(id: string, dto: AdjustBalanceDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const newBalance = user.balance + dto.amount;
    if (newBalance < 0) {
      throw new BadRequestException('This adjustment would result in a negative balance');
    }

    user.balance = newBalance;
    await user.save();

    await this.transactionModel.create({
      user: user._id,
      type: TransactionType.ADJUSTMENT,
      amount: Math.abs(dto.amount),
      status: TransactionStatus.COMPLETED,
      reference: `ADJ-${randomUUID()}`,
      description: `Admin balance adjustment: ${dto.reason}`,
    });

    await this.mailService.sendBalanceAdjustedEmail(user.email, user.fullName, dto.amount, dto.reason);
    await this.notificationsService.create(
      user._id.toString(),
      dto.amount >= 0 ? 'Balance Credited' : 'Balance Adjusted',
      `Your balance was ${dto.amount >= 0 ? 'credited' : 'debited'} by $${Math.abs(dto.amount).toLocaleString()}. Reason: ${dto.reason}`,
      'account',
    );

    return user;
  }
}