import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  findMine(@CurrentUser('userId') userId: string, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.findMine(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notificationsService.remove(userId, id);
  }
}