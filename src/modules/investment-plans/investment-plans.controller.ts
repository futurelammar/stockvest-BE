import {
  Controller,
  Get,
  Post,
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
import { InvestmentPlansService } from './investment-plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { QueryPlansDto } from './dto/query-plans.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Investment Plans')
@Controller('investment-plans')
export class InvestmentPlansController {
  constructor(private plansService: InvestmentPlansService) {}

  // ---------- Public ----------

  @Get()
  @ApiOperation({ summary: 'Browse active investment plans (public)' })
  findAllPublic(@Query() query: QueryPlansDto) {
    return this.plansService.findAllPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a single investment plan (public)' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  // ---------- Admin ----------

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all plans regardless of status' })
  findAllAdmin(@Query() query: QueryPlansDto) {
    return this.plansService.findAllAdmin(query);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('featuredImage', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Create a new investment plan' })
  create(
    @Body() dto: CreatePlanDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.plansService.create(dto, file);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('featuredImage', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Update an investment plan' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.plansService.update(id, dto, file);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Deactivate a plan (soft delete)' })
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }
}