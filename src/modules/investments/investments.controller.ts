import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { QueryInvestmentsDto } from './dto/query-investments.dto';
import { AdjustInvestmentDatesDto } from './dto/adjust-dates.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { AdminCreateInvestmentDto } from './dto/admin-create-investment.dto';
import { CreditProfitDto } from './dto/credit-profit.dto';

@ApiTags('Investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Invest in a plan' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateInvestmentDto) {
    return this.investmentsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my investments' })
  findMine(@CurrentUser('userId') userId: string, @Query() query: QueryInvestmentsDto) {
    return this.investmentsService.findMyInvestments(userId, query);
  }
  
  @Get('me/:id')
  @ApiOperation({ summary: 'Get one of my investments' })
  findMineOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.investmentsService.findOne(userId, id);
  }
  
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all investments' })
  findAllAdmin(@Query() query: QueryInvestmentsDto) {
    return this.investmentsService.findAllAdmin(query);
  }



  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] View any investment' })
  findOneAdmin(@Param('id') id: string) {
    return this.investmentsService.findOne('', id, true);
  }

  @Patch('admin/:id/pause')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Pause an active investment — remaining time is preserved' })
  pause(@Param('id') id: string) {
    return this.investmentsService.pause(id);
  }

  @Patch('admin/:id/resume')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Resume a paused investment' })
  resume(@Param('id') id: string) {
    return this.investmentsService.resume(id);
  }

  @Patch('admin/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Cancel an investment and refund the principal' })
  cancel(@Param('id') id: string) {
    return this.investmentsService.cancel(id);
  }


@Post('admin/create')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@ApiOperation({ summary: '[Admin] Create an investment on behalf of a user' })
adminCreate(@CurrentUser('userId') adminId: string, @Body() dto: AdminCreateInvestmentDto) {
  return this.investmentsService.adminCreate(adminId, dto);
}

@Patch('admin/:id/credit-profit')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@ApiOperation({ summary: '[Admin] Credit profit for a specific investment' })
creditProfit(@Param('id') id: string, @Body() dto: CreditProfitDto) {
  return this.investmentsService.creditProfit(id, dto);
}

  @Patch('admin/:id/adjust-dates')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "[Admin] Manually adjust an investment's start/maturity dates (e.g. backdating, corrections)" })
  adjustDates(@Param('id') id: string, @Body() dto: AdjustInvestmentDatesDto) {
    return this.investmentsService.adjustDates(id, dto);
  }
}