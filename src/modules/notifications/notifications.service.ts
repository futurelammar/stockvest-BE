import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  // Called internally by other services — not exposed as a public endpoint
  async create(userId: string, title: string, message: string, type?: string) {
    return this.notificationModel.create({ user: userId, title, message, type });
  }

  async findMine(userId: string, query: QueryNotificationsDto) {
    const { page = 1, limit = 10, isRead } = query;
    const filter: Record<string, any> = { user: userId };
    if (typeof isRead === 'boolean') filter.isRead = isRead;

    const skip = (page - 1) * limit;
    const [data, total, unreadCount] = await Promise.all([
      this.notificationModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ user: userId, isRead: false }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount } };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationModel.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }
    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany({ user: userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  async remove(userId: string, id: string) {
    const notification = await this.notificationModel.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }
    await notification.deleteOne();
    return { message: 'Notification deleted' };
  }
}