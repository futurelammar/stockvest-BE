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
import { StocksService } from './stocks.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { QueryStocksDto } from './dto/query-stocks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Stocks')
@Controller('stocks')
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Get()
  @ApiOperation({ summary: 'Browse active stocks (public) — real and admin-created' })
  findAllActive(@Query() query: QueryStocksDto) {
    return this.stocksService.findAllActive(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a single stock (public)' })
  findOne(@Param('id') id: string) {
    return this.stocksService.findOne(id);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all stocks including inactive' })
  findAllAdmin(@Query() query: QueryStocksDto) {
    return this.stocksService.findAllAdmin(query);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Add a stock — real ticker (auto-priced) or custom (admin-priced)' })
  create(
    @Body() dto: CreateStockDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    logoFile?: Express.Multer.File,
  ) {
    return this.stocksService.create(dto, logoFile);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Update a stock' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    logoFile?: Express.Multer.File,
  ) {
    return this.stocksService.update(id, dto, logoFile);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Disable a stock' })
  disable(@Param('id') id: string) {
    return this.stocksService.disable(id);
  }
}