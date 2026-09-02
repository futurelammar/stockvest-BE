import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { ReviewDepositDto } from './dto/review-deposit.dto';
import { QueryDepositsDto } from './dto/query-deposits.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { EditDepositDto } from './dto/edit-deposit.dto';

@ApiTags('Deposits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a deposit request with a pre-uploaded proof URL' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateDepositDto) {
    return this.depositsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my deposit requests' })
  findMine(@CurrentUser('userId') userId: string, @Query() query: QueryDepositsDto) {
    return this.depositsService.findMyDeposits(userId, query);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'View one of my deposit requests' })
  findMineOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.depositsService.findOne(userId, id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all deposit requests' })
  findAllAdmin(@Query() query: QueryDepositsDto) {
    return this.depositsService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] View a single deposit request' })
  findOneAdmin(@Param('id') id: string) {
    return this.depositsService.findOne('', id, true);
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Approve a deposit and credit user balance' })
  approve(@CurrentUser('userId') adminId: string, @Param('id') id: string) {
    return this.depositsService.approve(id, adminId);
  }

  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Reject a deposit request' })
  reject(@CurrentUser('userId') adminId: string, @Param('id') id: string, @Body() dto: ReviewDepositDto) {
    return this.depositsService.reject(id, adminId, dto);
  }

@Patch('admin/:id/edit')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@ApiOperation({ summary: '[Admin] Edit a deposit — amount, coin, network, or backdate/frontdate the createdAt date' })
edit(@Param('id') id: string, @Body() dto: EditDepositDto) {
  return this.depositsService.edit(id, dto);
}
}