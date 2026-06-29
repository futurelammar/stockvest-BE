import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  // ---------- Public ----------

  @Get()
  @ApiOperation({ summary: 'List active wallets users can deposit to' })
  findAllActive() {
    return this.walletsService.findAllActive();
  }

  // ---------- Admin ----------

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all wallets including disabled' })
  findAllAdmin() {
    return this.walletsService.findAllAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('qrCode', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Create a new wallet address' })
  create(
    @Body() dto: CreateWalletDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    qrFile?: Express.Multer.File,
  ) {
    return this.walletsService.create(dto, qrFile);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('qrCode', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Edit a wallet address' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    qrFile?: Express.Multer.File,
  ) {
    return this.walletsService.update(id, dto, qrFile);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Disable a wallet address' })
  disable(@Param('id') id: string) {
    return this.walletsService.disable(id);
  }
}