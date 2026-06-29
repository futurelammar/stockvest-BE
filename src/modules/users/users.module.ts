import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CloudinaryModule } from '../../uploads/uploads.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    CloudinaryModule,
    MailModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}