import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { UpdateUserTotalsDto } from './dto/update-user-totals.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my transaction history' })
  findMine(@CurrentUser('userId') userId: string, @Query() query: QueryTransactionsDto) {
    return this.transactionsService.findMine(userId, query);
  }

  @Get('me/summary')
  @ApiOperation({ summary: 'Get my wallet summary (totals by type)' })
  getSummary(@CurrentUser('userId') userId: string) {
    return this.transactionsService.getSummary(userId);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'View one of my transactions' })
  findMineOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.transactionsService.findOne(userId, id);
  }
  @Get('admin/user/:id/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "[Admin] Get a user's dashboard totals" })
  getUserSummary(@Param('id') id: string) {
    return this.transactionsService.getSummary(id);
  }
 
  @Patch('admin/user/:id/totals')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "[Admin] Edit a user's dashboard totals" })
  updateUserTotals(@Param('id') id: string, @Body() dto: UpdateUserTotalsDto, @Req() req) {
    return this.transactionsService.setUserTotals(id, req.user.userId, dto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all transactions across all users' })
  findAllAdmin(@Query() query: QueryTransactionsDto) {
    return this.transactionsService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] View any transaction' })
  findOneAdmin(@Param('id') id: string) {
    return this.transactionsService.findOne('', id, true);
  }
}