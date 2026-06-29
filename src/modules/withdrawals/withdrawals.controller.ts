import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {   
  constructor(private withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Request a withdrawal' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my withdrawal requests' })
  findMine(@CurrentUser('userId') userId: string, @Query() query: QueryWithdrawalsDto) {
    return this.withdrawalsService.findMyWithdrawals(userId, query);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'View one of my withdrawal requests' })
  findMineOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.withdrawalsService.findOne(userId, id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all withdrawal requests' })
  findAllAdmin(@Query() query: QueryWithdrawalsDto) {
    return this.withdrawalsService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] View a single withdrawal request' })
  findOneAdmin(@Param('id') id: string) {
    return this.withdrawalsService.findOne('', id, true);
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Approve a withdrawal request' })
  approve(@CurrentUser('userId') adminId: string, @Param('id') id: string) {
    return this.withdrawalsService.approve(id, adminId);
  }

  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Reject a withdrawal request and refund balance' })
  reject(
    @CurrentUser('userId') adminId: string,
    @Param('id') id: string,
    @Body() dto: ReviewWithdrawalDto,
  ) {
    return this.withdrawalsService.reject(id, adminId, dto);
  }

  @Patch('admin/:id/mark-paid')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Mark an approved withdrawal as paid' })
  markAsPaid(@Param('id') id: string) {
    return this.withdrawalsService.markAsPaid(id);
  }
}